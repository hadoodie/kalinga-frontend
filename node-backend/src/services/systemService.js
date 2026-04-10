// System / health-check service

const getSystemStatus = async () => {
  return {
    status: 'operational',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    services: {
      api: 'up',
      database: 'up',
    },
  };
};

export default { getSystemStatus };
