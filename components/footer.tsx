import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#0F2651] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <img 
              src="/logo2.svg" 
              alt="Catcher Logo" 
              className="h-8 w-auto"
            />
            <p className="mt-4 text-slate-400 max-w-md">
              Catcher helps you secure your valuables, instantly report them stolen, and help stop thieves from reselling them.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/stolen-items" className="hover:text-white transition-colors">Stolen Items</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">API</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400">© 2024 Catcher. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Terms</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}