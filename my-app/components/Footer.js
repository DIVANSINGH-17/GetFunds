const Footer = () => {
  return (
    <footer className='flex min-h-16 items-center justify-center border-t border-slate-800 bg-slate-950 px-4 text-center text-sm text-slate-400'>
        &copy; {new Date().getFullYear()} GetFunds Demo. Razorpay Test Mode only; no real money is processed.
    </footer>
  )
}

export default Footer
