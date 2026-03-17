const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'components', 'logistics', 'LogisDash.jsx');
let content = fs.readFileSync(p, 'utf8');

const regex = /<div className="flex flex-col md:flex-row items-center flex-1 w-full relative">[\s\S]*?<\/div>\s*<\/div>\s*<\/Link>/m;

const replacement = \<div className="flex flex-col md:flex-row items-center flex-1 w-full relative">
          {/* Left panel: Stats + Legend */}
          <div className="w-full md:w-1/2 flex flex-col justify-center items-start mb-4 md:mb-0">
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Total Inventory</p>
            <p className="text-5xl font-extrabold mb-4">{totalRemaining}</p>
            <div className="space-y-1 text-15px mb-4">
              <p className="font-medium text-gray-600 flex items-center">
                <Home className="h-4 w-4 mr-1 text-gray-500" /> {facilityCount}{" "}
                Facilities
              </p>
              <p className="font-medium text-gray-600 flex items-center">
                <Briefcase className="h-4 w-4 mr-1 text-gray-500" />{" "}
                {itemCategories} Categories
              </p>
              <p className="font-medium text-red-600 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 text-red-600" />{" "}
                {criticalCount} Critical
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              {facilities && facilities.length > 0 ? (
                facilities.map((fac, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 block rounded-xs shrink-0" 
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    ></span>
                    <span className="text-sm text-gray-800" title={fac.name}>
                      {fac.name}
                    </span>
                  </div>
                ))
              ) : null}
            </div>
          </div>

          {/* Right panel: Pie Chart */}
          <div className="w-full md:w-1/2 flex flex-col justify-center items-center h-[160px] md:h-[200px] relative">
            {facilities && facilities.length > 0 ? (
              <FacilityPieChart data={facilities} />
            ) : (
              <p className="text-gray-400">No facility data</p>
            )}
          </div>
        </div>
      </div>
    </Link>\;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(p, content);
    console.log('Successfully updated LogisDash.jsx');
} else {
    console.log('Regex did not match.');
}
