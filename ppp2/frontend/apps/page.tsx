import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8 text-center">
        {/* Hero Section */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
            Todo App
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            A modern, full-stack task management application built with Next.js 15 and FastAPI
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center items-center flex-wrap">
          <Link
            href="/dashboard"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
          >
            View Dashboard
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-lg shadow-md border border-gray-300 transition-colors duration-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Login
          </Link>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="text-4xl mb-3">✓</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Task Management
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Create, update, and organize your tasks with priorities and due dates
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="text-4xl mb-3">🔔</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Smart Notifications
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Get timely reminders for upcoming and overdue tasks
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="text-4xl mb-3">💾</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Persistent Storage
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your tasks are safely stored and synced across devices
            </p>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="pt-12 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Built With
          </h3>
          <div className="flex justify-center gap-6 text-gray-600 dark:text-gray-400">
            <span>Next.js 15</span>
            <span>•</span>
            <span>TypeScript</span>
            <span>•</span>
            <span>Tailwind CSS</span>
            <span>•</span>
            <span>FastAPI</span>
          </div>
        </div>
      </div>
    </main>
  );
}
