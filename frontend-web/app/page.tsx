export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 transition-colors">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-pink-500 dark:to-orange-400 bg-clip-text text-transparent">
          Todo App
        </h1>
        <p className="text-xl text-gray-700 dark:text-white/80 mb-3">
          Full-stack web application
        </p>
        <p className="text-gray-600 dark:text-white/60 mb-12 max-w-md mx-auto">
          Manage your tasks efficiently with our beautiful, feature-rich todo application.
          Built with Next.js, TypeScript, and Tailwind CSS.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-pink-500 dark:to-orange-400 text-white rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
          >
            Login
          </a>
          <a
            href="/signup"
            className="px-8 py-3 border-2 border-purple-600 dark:border-pink-500 text-purple-600 dark:text-pink-400 rounded-lg hover:bg-purple-50 dark:hover:bg-white/10 transition-all duration-200 font-semibold"
          >
            Sign Up
          </a>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
          <div className="bg-white/70 dark:bg-white/8 backdrop-blur-lg border border-gray-200 dark:border-purple-400/20 rounded-xl p-6 transition-all hover:scale-105">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Task Management</h3>
            <p className="text-sm text-gray-600 dark:text-white/60">Organize tasks with priorities, tags, and due dates</p>
          </div>

          <div className="bg-white/70 dark:bg-white/8 backdrop-blur-lg border border-gray-200 dark:border-purple-400/20 rounded-xl p-6 transition-all hover:scale-105">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Secure Auth</h3>
            <p className="text-sm text-gray-600 dark:text-white/60">JWT authentication with encrypted passwords</p>
          </div>

          <div className="bg-white/70 dark:bg-white/8 backdrop-blur-lg border border-gray-200 dark:border-purple-400/20 rounded-xl p-6 transition-all hover:scale-105">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-400 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Beautiful UI</h3>
            <p className="text-sm text-gray-600 dark:text-white/60">Modern glassmorphism design with dark/light mode</p>
          </div>
        </div>
      </div>
    </main>
  )
}
