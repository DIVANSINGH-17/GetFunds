"use server";

import { revalidatePath } from "next/cache";
import Payment from "@/models/Payment";
import Project from "@/models/Project";
import connectDb from "@/db/connectDB";
import User from "@/models/User";
import { requireCurrentUser } from "@/lib/current-user";
import {
  normalizeUsername,
  validateOptionalUrl,
  validateUsername,
} from "@/lib/usernames";

const contributionMatch = (user) => ({
  done: true,
  $or: [
    { creatorId: user._id },
    { to_user: user.username },
  ],
});

const serializeContribution = (payment) => ({
  id: String(payment._id),
  name: payment.name,
  message: payment.message || "",
  amount: payment.amount,
  mode: payment.mode || "demo",
  createdAt: payment.createdAt
    ? new Date(payment.createdAt).toISOString()
    : null,
});

const serializeProject = (project) => ({
  id: String(project._id),
  title: project.title,
  description: project.description || "",
  files: project.files.map((file) => ({
    id: String(file.fileId),
    filename: file.filename,
    contentType: file.contentType,
    size: file.size,
    url: `/api/projects/files/${file.fileId}`,
  })),
  updatedAt: project.updatedAt
    ? new Date(project.updatedAt).toISOString()
    : null,
});

const getCreatorProjects = async (creatorId) => {
  const projects = await Project.find({ creatorId })
    .select("title description files updatedAt")
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();

  return projects.map(serializeProject);
};

const getContributionStats = async (user) => {
  const [aggregateResult, topContributions] = await Promise.all([
    Payment.aggregate([
      { $match: contributionMatch(user) },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          contributionCount: { $sum: 1 },
          averageAmount: { $avg: "$amount" },
          uniqueSupporters: { $addToSet: "$name" },
        },
      },
      {
        $project: {
          _id: 0,
          totalAmount: 1,
          contributionCount: 1,
          averageAmount: 1,
          supporterCount: { $size: "$uniqueSupporters" },
        },
      },
    ]),
    Payment.find(contributionMatch(user))
      .select("name message amount mode createdAt")
      .sort({ amount: -1, createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  const aggregate = aggregateResult[0] || {
    totalAmount: 0,
    contributionCount: 0,
    averageAmount: 0,
    supporterCount: 0,
  };

  return {
    stats: {
      totalAmount: aggregate.totalAmount || 0,
      contributionCount: aggregate.contributionCount || 0,
      supporterCount: aggregate.supporterCount || 0,
      averageAmount: Math.round(aggregate.averageAmount || 0),
    },
    topContributions: topContributions.map(serializeContribution),
  };
};

const getRecentContributions = async (user, limit) => {
  const recent = await Payment.find(contributionMatch(user))
    .select("name message amount mode createdAt")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return recent.map(serializeContribution);
};

const TREND_DAYS = 30;

// Daily verified totals for the last 30 days, with empty days filled in so
// the client can render a continuous chart.
const getContributionTrend = async (user) => {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (TREND_DAYS - 1));

  const rows = await Payment.aggregate([
    { $match: { ...contributionMatch(user), createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        amount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const byDay = new Map(rows.map((row) => [row._id, row]));

  return Array.from({ length: TREND_DAYS }, (_, index) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + index);
    const key = day.toISOString().slice(0, 10);
    const row = byDay.get(key);

    return {
      date: key,
      amount: row?.amount || 0,
      count: row?.count || 0,
    };
  });
};

const testCheckoutEnabled = () => Boolean(
  process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_") &&
  process.env.RAZORPAY_KEY_SECRET,
);

export const getPublicCreatorData = async (usernameInput) => {
  const username = normalizeUsername(usernameInput);

  if (!username) {
    return null;
  }

  await connectDb();

  const user = await User.findOne({ username })
    .select("_id name username profilepic coverpic bio website fundingGoal createdAt")
    .lean();

  if (!user) {
    return null;
  }

  const [contributionData, recentContributions, projects] = await Promise.all([
    getContributionStats(user),
    getRecentContributions(user, 10),
    getCreatorProjects(user._id),
  ]);

  return {
    profile: {
      name: user.name || user.username,
      username: user.username,
      profilepic: user.profilepic || "",
      coverpic: user.coverpic || "",
      bio: user.bio || "",
      website: user.website || "",
      fundingGoal: user.fundingGoal || 10000,
      joinedAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
    },
    projects,
    testCheckoutEnabled: testCheckoutEnabled(),
    ...contributionData,
    recentContributions,
  };
};

const serializeExploreCreator = (user, totals) => ({
  id: String(user._id),
  name: user.name || user.username,
  username: user.username,
  profilepic: user.profilepic || "",
  bio: user.bio || "",
  fundingGoal: user.fundingGoal || 10000,
  totalAmount: totals?.totalAmount || 0,
  contributionCount: totals?.contributionCount || 0,
});

// Public discovery data: creators ranked by verified funding, plus the
// newest creators so pages with no contributions are still discoverable.
export const getExploreData = async () => {
  await connectDb();

  const [leaderboardRows, newestUsers] = await Promise.all([
    Payment.aggregate([
      { $match: { done: true, creatorId: { $ne: null } } },
      {
        $group: {
          _id: "$creatorId",
          totalAmount: { $sum: "$amount" },
          contributionCount: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 12 },
    ]),
    User.find({})
      .select("name username profilepic bio fundingGoal")
      .sort({ createdAt: -1 })
      .limit(12)
      .lean(),
  ]);

  const leaderboardUsers = await User.find({
    _id: { $in: leaderboardRows.map((row) => row._id) },
  })
    .select("name username profilepic bio fundingGoal")
    .lean();

  const usersById = new Map(
    leaderboardUsers.map((user) => [String(user._id), user]),
  );

  const topCreators = leaderboardRows
    .map((row) => {
      const user = usersById.get(String(row._id));
      return user ? serializeExploreCreator(user, row) : null;
    })
    .filter(Boolean);

  const newestTotals = newestUsers.length
    ? await Payment.aggregate([
      {
        $match: {
          done: true,
          creatorId: { $in: newestUsers.map((user) => user._id) },
        },
      },
      {
        $group: {
          _id: "$creatorId",
          totalAmount: { $sum: "$amount" },
          contributionCount: { $sum: 1 },
        },
      },
    ])
    : [];

  const totalsById = new Map(
    newestTotals.map((row) => [String(row._id), row]),
  );

  return {
    topCreators,
    newestCreators: newestUsers.map((user) =>
      serializeExploreCreator(user, totalsById.get(String(user._id))),
    ),
  };
};

export const getDashboardData = async () => {
  try {
    const user = await requireCurrentUser();
    const [contributionData, recentContributions, projects, trend] = await Promise.all([
      getContributionStats(user),
      getRecentContributions(user, 6),
      getCreatorProjects(user._id),
      getContributionTrend(user),
    ]);

    return {
      ok: true,
      profile: {
        email: user.email,
        name: user.name || "",
        username: user.username,
        profilepic: user.profilepic || "",
        coverpic: user.coverpic || "",
        bio: user.bio || "",
        website: user.website || "",
        fundingGoal: user.fundingGoal || 10000,
      },
      projects,
      trend,
      ...contributionData,
      recentContributions,
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || "Could not load the dashboard.",
    };
  }
};

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const serializeCreatorSearchResult = (user) => ({
  id: String(user._id),
  name: user.name || user.username,
  username: user.username,
  profilepic: user.profilepic || "",
});

export const searchCreators = async (queryInput) => {
  const query = String(queryInput || "").trim().slice(0, 40);

  if (query.length < 2) {
    return [];
  }

  await connectDb();

  const escapedQuery = escapeRegex(query);
  const prefixPattern = new RegExp(`^${escapedQuery}`, "i");
  const containsPattern = new RegExp(escapedQuery, "i");
  const projection = "name username profilepic";

  const prefixMatches = await User.find({
    $or: [
      { username: prefixPattern },
      { name: prefixPattern },
    ],
  })
    .select(projection)
    .sort({ username: 1 })
    .limit(8)
    .lean();

  if (prefixMatches.length >= 8) {
    return prefixMatches.map(serializeCreatorSearchResult);
  }

  const prefixIds = prefixMatches.map((user) => user._id);
  const similarMatches = await User.find({
    _id: { $nin: prefixIds },
    $or: [
      { username: containsPattern },
      { name: containsPattern },
    ],
  })
    .select(projection)
    .sort({ username: 1 })
    .limit(8 - prefixMatches.length)
    .lean();

  return [...prefixMatches, ...similarMatches].map(
    serializeCreatorSearchResult,
  );
};

export const updateProfile = async (formData) => {
  try {
    const user = await requireCurrentUser();
    const usernameResult = validateUsername(formData.get("username"));
    const profilepicResult = validateOptionalUrl(
      formData.get("profilepic"),
      "Profile picture",
    );
    const coverpicResult = validateOptionalUrl(
      formData.get("coverpic"),
      "Cover picture",
    );
    const websiteResult = validateOptionalUrl(
      formData.get("website"),
      "Website",
    );
    const name = String(formData.get("name") || "").trim();
    const bio = String(formData.get("bio") || "").trim();
    const fundingGoal = Number(formData.get("fundingGoal"));

    if (!usernameResult.ok) {
      return usernameResult;
    }

    if (!profilepicResult.ok) {
      return profilepicResult;
    }

    if (!coverpicResult.ok) {
      return coverpicResult;
    }

    if (!websiteResult.ok) {
      return websiteResult;
    }

    if (bio.length > 300) {
      return {
        ok: false,
        error: "Bio must contain at most 300 characters.",
      };
    }

    if (name.length > 80) {
      return {
        ok: false,
        error: "Display name must contain at most 80 characters.",
      };
    }

    if (
      !Number.isInteger(fundingGoal) ||
      fundingGoal < 100 ||
      fundingGoal > 10000000
    ) {
      return {
        ok: false,
        error: "Funding goal must be a whole number between ₹100 and ₹1,00,00,000.",
      };
    }

    const username = usernameResult.value;
    const oldUsername = user.username;

    if (username !== oldUsername) {
      const existingUser = await User.exists({
        username,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return {
          ok: false,
          error: "That username is already in use.",
        };
      }
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          name,
          username,
          profilepic: profilepicResult.value,
          coverpic: coverpicResult.value,
          bio,
          website: websiteResult.value,
          fundingGoal,
        },
      },
      { runValidators: true },
    );

    if (username !== oldUsername) {
      await Payment.updateMany(
        {
          $or: [
            { creatorId: user._id },
            { to_user: oldUsername },
          ],
        },
        { $set: { to_user: username } },
      );

      revalidatePath(`/${oldUsername}`);
    }

    revalidatePath(`/${username}`);
    revalidatePath("/dashboard");

    return {
      ok: true,
      username,
      message: "Profile updated successfully.",
    };
  } catch (error) {
    if (error?.code === 11000) {
      return {
        ok: false,
        error: "That email or username is already in use.",
      };
    }

    return {
      ok: false,
      error: error.message || "Could not update the profile.",
    };
  }
};
