module.exports = {
  apps: [
    {
      name: "chessworks-backend",
      script: "dist/server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env_production: {
        NODE_ENV: "production",
      },
      max_memory_restart: "300M",
    },
  ],
};
