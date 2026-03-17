import re

with open('src/components/logistics/LogisDash.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

pattern = re.compile(r'<div className="flex flex-col lg:flex-row flex-1 w-full gap-6">.*?</div>\s*</div>\s*</Link>', re.DOTALL)

replacement = '''<div className="flex flex-col flex-1 w-full h-full justify-between gap-4">
            
            {/* Top row: Metrics + Chart (Wraps on very small screens) */}
            <div className="flex flex-wrap xl:flex-nowrap items-center justify-between gap-4 w-full">
              
              {/* Key Metrics */}
              <div className="flex flex-col justify-center shrink-0 min-w-[140px]">
                <p className="text-5xl font-extrabold text-gray-900 leading-none">{totalRemaining}</p>
                <p className="text-[11px] md:text-xs text-gray-500 uppercase font-bold tracking-wider mt-2 mb-4">Total Inventory</p>
                
                <div className="space-y-3 text-sm">
                  <p className="font-medium text-gray-600 flex items-center">
                    <span className="w-6 flex shrink-0 justify-start"><Home className="h-4 w-4 text-gray-400" /></span>
                    <span className="truncate">{facilityCount} Facilities</span>
                  </p>
                  <p className="font-medium text-gray-600 flex items-center">
                    <span className="w-6 flex shrink-0 justify-start"><Briefcase className="h-4 w-4 text-gray-400" /></span>
                    <span className="truncate">{itemCategories} Categories</span>
                  </p>
                  <p className="font-semibold text-red-600 flex items-center bg-red-50 py-1 px-2 rounded-lg -ml-2 w-max">
                    <span className="w-6 flex shrink-0 justify-start"><AlertTriangle className="h-4 w-4 text-red-600" /></span>
                    <span>{criticalCount} Critical Alerts</span>
                  </p>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="w-full sm:w-auto flex-1 flex justify-center items-center min-w-[140px] h-[160px] md:h-[180px] relative">
                {facilities && facilities.length > 0 ? (
                  <FacilityPieChart data={facilities} />
                ) : (
                  <p className="text-gray-400 text-sm">No facility data</p>
                )}
              </div>
            </div>

            {/* Bottom: Custom Legend Container */}
            <div className="w-full bg-slate-50/70 rounded-xl p-3 md:p-4 border border-slate-100 flex flex-col space-y-3 mt-auto">
              {facilities && facilities.length > 0 ? (
                facilities.map((fac, idx) => (
                  <div key={idx} className="flex items-start gap-3 w-full">
                    <div
                      className="w-3.5 h-3.5 rounded shrink-0 mt-[2px] shadow-sm ring-1 ring-black/5"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    ></div>
                    <div className="flex-1 text-left min-w-0">
                      <p 
                        className="text-[13px] md:text-sm text-gray-700 font-medium leading-tight m-0 p-0 line-clamp-2" 
                        title={fac.name}
                      >
                        {fac.name}
                      </p>
                    </div>
                  </div>
                ))
              ) : null}
            </div>

          </div>
        </div>
      </Link>'''

new_text = pattern.sub(replacement, text)

with open('src/components/logistics/LogisDash.jsx', 'w', encoding='utf-8') as f:
    f.write(new_text)

print('Updated File.')
