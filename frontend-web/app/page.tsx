'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
        {/* Floating geometric shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"
            animate={{
              y: [0, 30, 0],
              x: [0, 20, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
            animate={{
              y: [0, -40, 0],
              x: [0, -30, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.h1
            className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent leading-tight tracking-wide"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Organize Your Life,
            <br />
            One Task at a Time
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Transform chaos into clarity with our intelligent task management system.
            Built for teams and individuals who value productivity.
          </motion.p>

          {/* Dual CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link
              href="/signup"
              className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-semibold text-lg tracking-wide hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 min-w-[220px]"
            >
              Get Started Free
              <span className="ml-2 inline-block group-hover:translate-x-1 transition-transform">
                →
              </span>
            </Link>

            <Link
              href="#preview"
              className="px-10 py-5 border-2 border-cyan-500 text-cyan-400 rounded-lg font-semibold text-lg tracking-wide hover:bg-cyan-500/10 transition-all duration-300 hover:scale-105 min-w-[220px]"
            >
              Watch Demo
            </Link>
          </motion.div>

          <motion.p
            className="mt-8 text-sm text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            No credit card required • Free forever plan
          </motion.p>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </section>

      {/* 2. Features Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Everything You Need to Stay Productive
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powerful features designed to help you focus on what matters most
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                ),
                title: "Smart Organization",
                description: "AI-powered task categorization and prioritization to keep your workflow efficient and organized."
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                ),
                title: "Cross-Platform Sync",
                description: "Seamlessly access your tasks from any device. Desktop, mobile, or web - your data is always in sync."
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                ),
                title: "Team Collaboration",
                description: "Share tasks and collaborate with your team in real-time. Delegate, track progress, and achieve together."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="relative group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="h-full bg-white/5 backdrop-blur-lg border border-blue-500/20 rounded-2xl p-8 hover:border-cyan-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:scale-105">
                  {/* Icon */}
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {feature.icon}
                    </svg>
                  </div>

                  <h3 className="text-2xl font-semibold mb-4 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. App Preview Section */}
      <section id="preview" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Beautiful Interface. Powerful Features.
            </h2>
            <p className="text-xl text-gray-400">
              Experience productivity reimagined
            </p>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {/* App mockup placeholder */}
            <div className="relative bg-gradient-to-br from-blue-900/50 to-cyan-900/30 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-8 shadow-2xl">
              <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl flex items-center justify-center overflow-hidden">
                {/* Simulated app interface */}
                <div className="w-full h-full p-6 space-y-4">
                  {/* Mock header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="h-8 w-48 bg-blue-500/20 rounded-lg"></div>
                    <div className="flex gap-3">
                      <div className="h-8 w-8 bg-cyan-500/20 rounded-full"></div>
                      <div className="h-8 w-8 bg-blue-500/20 rounded-full"></div>
                    </div>
                  </div>

                  {/* Mock tasks */}
                  {[1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="h-16 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                    />
                  ))}
                </div>
              </div>

              {/* Floating feature highlights */}
              <motion.div
                className="absolute -left-8 top-1/4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-xl hidden lg:block"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-sm font-semibold">✓ Priority Levels</p>
              </motion.div>

              <motion.div
                className="absolute -right-8 top-1/2 bg-cyan-600 text-white px-6 py-3 rounded-lg shadow-xl hidden lg:block"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-sm font-semibold">✓ Smart Tags</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. Benefits Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                Boost Your Productivity by 10x
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Join thousands of professionals who have transformed their workflow
                and reclaimed their time.
              </p>

              <div className="space-y-6">
                {[
                  { metric: "5+ hours", label: "Saved per week" },
                  { metric: "95%", label: "Task completion rate" },
                  { metric: "50K+", label: "Happy users" }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                    <div>
                      <span className="text-3xl font-bold text-cyan-400">{stat.metric}</span>
                      <span className="ml-3 text-gray-400">{stat.label}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="grid grid-cols-2 gap-6"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              {[
                { icon: "⚡", title: "Lightning Fast", desc: "Instant sync across devices" },
                { icon: "🔒", title: "Secure", desc: "Bank-level encryption" },
                { icon: "📊", title: "Analytics", desc: "Track your productivity" },
                { icon: "🎯", title: "Goal Tracking", desc: "Set and achieve targets" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="bg-white/5 backdrop-blur-lg border border-blue-500/20 rounded-xl p-6 hover:border-cyan-500/40 transition-all duration-300 hover:scale-105"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5. Social Proof Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Loved by Thousands of Users
            </h2>
            <p className="text-xl text-gray-400">
              See what our community has to say
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Product Manager",
                company: "TechCorp",
                avatar: "SJ",
                testimonial: "This app completely transformed how I manage my projects. The AI categorization is a game-changer!",
                rating: 5
              },
              {
                name: "Michael Chen",
                role: "Freelance Designer",
                company: "Independent",
                avatar: "MC",
                testimonial: "Finally, a todo app that doesn't feel overwhelming. Clean, intuitive, and incredibly powerful.",
                rating: 5
              },
              {
                name: "Emily Rodriguez",
                role: "Team Lead",
                company: "StartupXYZ",
                avatar: "ER",
                testimonial: "Our team's productivity increased by 40% after switching to this platform. Highly recommend!",
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white/5 backdrop-blur-lg border border-blue-500/20 rounded-2xl p-8 hover:border-cyan-500/40 transition-all duration-300 hover:scale-105"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <p className="text-gray-300 mb-6 leading-relaxed">"{testimonial.testimonial}"</p>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-gray-400">{testimonial.role} at {testimonial.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Pricing Teaser */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-400">
              Choose the plan that fits your needs
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Free",
                price: "$0",
                period: "forever",
                features: [
                  "Up to 50 tasks",
                  "Basic organization",
                  "Mobile & web access",
                  "Email support"
                ],
                cta: "Start Free",
                highlighted: false
              },
              {
                name: "Pro",
                price: "$12",
                period: "per month",
                features: [
                  "Unlimited tasks",
                  "AI-powered features",
                  "Team collaboration",
                  "Priority support",
                  "Advanced analytics"
                ],
                cta: "Start Free Trial",
                highlighted: true
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "contact us",
                features: [
                  "Everything in Pro",
                  "Custom integrations",
                  "Dedicated support",
                  "SLA guarantee",
                  "Advanced security"
                ],
                cta: "Contact Sales",
                highlighted: false
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                className={`relative bg-white/5 backdrop-blur-lg border rounded-2xl p-8 ${
                  plan.highlighted
                    ? "border-cyan-500 shadow-2xl shadow-cyan-500/20 scale-105"
                    : "border-blue-500/20"
                } hover:scale-105 transition-all duration-300`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-cyan-400">{plan.price}</span>
                  <span className="text-gray-400 ml-2">/ {plan.period}</span>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-300">
                      <svg className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`block w-full py-4 rounded-lg font-semibold text-center transition-all duration-300 ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-xl hover:shadow-cyan-500/50"
                      : "border-2 border-blue-500 text-blue-400 hover:bg-blue-500/10"
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Final CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-blue-600/20"></div>

        <motion.div
          className="max-w-4xl mx-auto text-center relative z-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-white leading-tight">
            Ready to Transform Your Productivity?
          </h2>
          <p className="text-2xl text-gray-300 mb-12">
            Join 50,000+ users who are already getting more done.
          </p>

          <Link
            href="/signup"
            className="inline-block px-12 py-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-bold text-xl tracking-wide hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-110"
          >
            Get Started for Free
          </Link>

          <p className="mt-6 text-gray-400">
            No credit card required • Cancel anytime
          </p>
        </motion.div>
      </section>

      {/* 8. Footer */}
      <footer className="border-t border-blue-500/20 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                TodoApp
              </h3>
              <p className="text-gray-400 mb-6">
                Organize your life, one task at a time.
              </p>
              {/* Social Icons */}
              <div className="flex gap-4">
                {['twitter', 'github', 'linkedin'].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="w-10 h-10 bg-white/5 hover:bg-blue-500/20 rounded-lg flex items-center justify-center transition-colors duration-300"
                    aria-label={social}
                  >
                    <svg className="w-5 h-5 text-gray-400 hover:text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3">
                {['Features', 'Pricing', 'Roadmap', 'Changelog'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3">
                {['About', 'Blog', 'Careers', 'Contact'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-semibold text-white mb-4">Stay Updated</h4>
              <p className="text-gray-400 text-sm mb-4">
                Get the latest features and updates
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-4 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                />
                <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-blue-500/20 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2025 TodoApp. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
