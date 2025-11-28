// src/components/logistics/registry/StatusBadge.jsx
const StatusBadge = ({ status }) => {
  const statusConfig = {
    'Operational': { 
      color: 'bg-green-100 text-green-800 border-green-200',
      //icon: '🟢'
    },
    'Under Repair': { 
      color: 'bg-red-100 text-red-800 border-red-200 animate-pulse',
     //icon: '🔴'
    },
    'Standby': { 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      //icon: '🟡'
    }
  };
  
  const config = statusConfig[status] || statusConfig['Standby'];
  
  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${config.color}`}>
      {config.icon} {status}
    </span>
  );
};

export default StatusBadge;