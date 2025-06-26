/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer', 'chrome-aws-lambda', 'papaparse']
  },
  
  // Environment variables that should be available to the client
  env: {
    NEXT_PUBLIC_YOUR_NAME: process.env.NEXT_PUBLIC_YOUR_NAME,
    NEXT_PUBLIC_YOUR_WEBSITE: process.env.NEXT_PUBLIC_YOUR_WEBSITE,
    NEXT_PUBLIC_YOUR_CALENDLY: process.env.NEXT_PUBLIC_YOUR_CALENDLY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    // Add automation environment variables
    NEXT_PUBLIC_AUTOMATION_LEVEL: process.env.NEXT_PUBLIC_AUTOMATION_LEVEL,
    NEXT_PUBLIC_PUPPETEER_ENABLED: process.env.NEXT_PUBLIC_PUPPETEER_ENABLED,
  },

  // Images configuration for external sources
  images: {
    domains: [
      'i.ytimg.com', // YouTube thumbnails
      'yt3.ggpht.com', // YouTube channel images
      'lh3.googleusercontent.com', // Google images
      'logo.clearbit.com', // Clearbit logos
      'avatars.githubusercontent.com', // GitHub avatars
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '*.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'logo.clearbit.com',
      }
    ]
  },

  // Enhanced Webpack configuration for automation
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle server-only packages for automation
      config.externals.push({
        puppeteer: 'commonjs puppeteer',
        'youtube-transcript': 'commonjs youtube-transcript',
        'chrome-aws-lambda': 'commonjs chrome-aws-lambda',
        papaparse: 'commonjs papaparse'
      })
    } else {
      // Client-side fallbacks for Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        puppeteer: false,
      }
    }

    // Handle ES modules
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto'
    })

    // Handle CSV files
    config.module.rules.push({
      test: /\.csv$/,
      use: 'raw-loader'
    })

    return config
  },

  // API routes configuration
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
      // Add automation API routes
      {
        source: '/api/automation/:path*',
        destination: '/api/automation/:path*',
      },
    ]
  },

  // Enhanced headers for automation and security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Automation-Level',
          },
        ],
      },
      {
        source: '/api/automation/:path*',
        headers: [
          {
            key: 'X-Automation-Enabled',
            value: process.env.NEXT_PUBLIC_PUPPETEER_ENABLED || 'false',
          },
        ],
      },
    ]
  },

  // Redirect configuration
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/automation',
        destination: '/dashboard/campaigns',
        permanent: false,
      },
    ]
  },

  // Compression and optimization
  compress: true,
  poweredByHeader: false,
  
  // Output configuration for deployment
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Typescript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Enhanced experimental features for automation
  experimental: {
    serverComponentsExternalPackages: [
      'puppeteer', 
      'chrome-aws-lambda', 
      'papaparse',
      'youtube-transcript'
    ],
    // Enable app directory
    // appDir: true,
    // Enable server actions
    // serverActions: true,
  },

  // Runtime configuration with automation support
  serverRuntimeConfig: {
    // Server-side only
    youtubeApiKey: process.env.YOUTUBE_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    mongodbUri: process.env.MONGODB_URI,
    puppeteerEnabled: process.env.PUPPETEER_ENABLED === 'true',
    automationLevel: process.env.AUTOMATION_LEVEL || 'hybrid',
  },

  publicRuntimeConfig: {
    // Available on both server and client
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    yourName: process.env.NEXT_PUBLIC_YOUR_NAME,
    yourWebsite: process.env.NEXT_PUBLIC_YOUR_WEBSITE,
    yourCalendly: process.env.NEXT_PUBLIC_YOUR_CALENDLY,
    automationLevel: process.env.NEXT_PUBLIC_AUTOMATION_LEVEL || 'hybrid',
    puppeteerEnabled: process.env.NEXT_PUBLIC_PUPPETEER_ENABLED === 'true',
  },

  // Additional configuration for automation
  distDir: '.next',
  generateEtags: true,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Custom webpack aliases for automation modules
  webpack: (config, options) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/automation': 'lib/automation',
      '@/components': 'components',
      '@/lib': 'lib',
    }
    
    // Previous webpack config...
    if (options.isServer) {
      config.externals.push({
        puppeteer: 'commonjs puppeteer',
        'youtube-transcript': 'commonjs youtube-transcript',
        'chrome-aws-lambda': 'commonjs chrome-aws-lambda',
        papaparse: 'commonjs papaparse'
      })
    } else {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        puppeteer: false,
      }
    }

    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto'
    })

    config.module.rules.push({
      test: /\.csv$/,
      use: 'raw-loader'
    })

    return config
  },
}
module.exports = {
  async headers() {
    return [
      {
        source: '/api/youtube-transcript/:path*',
        headers: [
          { 
            key: 'Access-Control-Allow-Origin', 
            value: '*' 
          },
        ],
      },
    ]
  }
}

module.exports = nextConfig