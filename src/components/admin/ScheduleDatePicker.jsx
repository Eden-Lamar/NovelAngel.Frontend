
const ScheduleDatePicker = ({ register, name, min, disabled, error }) => {
  return (
    <div className="border-t border-gray-600 pt-6 mt-6">
      <label className="block mb-2 font-semibold text-lg text-gray-200">
        Schedule Auto-Unlock Date 
        <span className="text-gray-400 font-normal text-sm ml-2">
          (EST / New York Time)
        </span>
      </label>
      
      <div className="relative max-w-md group">
        {/* Custom Left Icon */}
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-200 group-focus-within:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        </div>
        
        {/* Premium Styled Native Input */}
        <input
          type="datetime-local"
          {...register(name)}
          className={`w-full pl-12 pr-4 py-3 rounded-xl text-slate-800 font-medium outline-none bg-slate-500 border-2 border-transparent focus:bg-slate-500 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 transition-all cursor-pointer hover:bg-slate-500/95 shadow-sm ${
            error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
          }`}
          disabled={disabled}
          min={min}
        />
      </div>
      
      <p className="text-xs text-gray-400 mt-2">
        Select the exact time this chapter should go live on the East Coast.
      </p>
      
      {/* Optional: Render validation error if one exists */}
      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
    </div>
  );
};

export default ScheduleDatePicker;

ScheduleDatePicker.propTypes = false