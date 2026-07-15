import type { Metadata } from "next";
import "./globals.css";
import { 
  HomeIcon,
  FolderIcon,
  QueueListIcon,
  CalendarIcon,
  PaintBrushIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  BellIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";

export const metadata: Metadata = {
  title: "EduClip | Micro-Learning Factory",
  description: "Turn long-form content into viral micro-learning assets.",
};

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon, current: true },
  { name: 'Projects', href: '/projects', icon: FolderIcon, current: false },
  { name: 'Library', href: '/library', icon: QueueListIcon, current: false },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon, current: false },
  { name: 'Architecture', href: '/architecture', icon: DocumentTextIcon, current: false },
  { name: 'Brand Kit', href: '/brand-kit', icon: PaintBrushIcon, current: false },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, current: false },
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className="h-full flex text-slate-900 overflow-hidden">
        {/* Sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-slate-200 bg-white px-6 pb-4 shadow-sm">
            <div className="flex h-16 shrink-0 items-center">
              <span className="text-2xl font-extrabold bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">EduClip</span>
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navigation.map((item) => (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          className={`
                            group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors
                            ${item.current ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'}
                          `}
                        >
                          <item.icon
                            className={`h-6 w-6 shrink-0 transition-colors ${item.current ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'}`}
                            aria-hidden="true"
                          />
                          {item.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:pl-72 flex flex-1 flex-col h-screen overflow-hidden">
          {/* Topbar */}
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              <form className="relative flex flex-1" action="#" method="GET">
                <label htmlFor="search-field" className="sr-only">Search Projects...</label>
                <MagnifyingGlassIcon
                  className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="search-field"
                  className="block h-full w-full border-0 py-0 pl-8 pr-0 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm bg-transparent outline-none"
                  placeholder="Search Projects..."
                  type="search"
                  name="search"
                />
              </form>
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                <div className="flex items-center text-sm font-semibold text-slate-600 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                  Credits: 42
                </div>
                <button type="button" className="-m-2.5 p-2.5 text-slate-400 hover:text-slate-500 transition-colors">
                  <span className="sr-only">View notifications</span>
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                </button>
                <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-200" aria-hidden="true" />
                <div className="flex items-center gap-x-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-md transition-colors">
                  <div className="h-8 w-8 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">JS</div>
                  <span className="text-sm font-semibold leading-6 text-slate-700 hidden md:block">Org: My Academy</span>
                </div>
              </div>
            </div>
          </div>

          <main className="relative flex-1 overflow-y-auto bg-slate-50/50 p-6 lg:p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
