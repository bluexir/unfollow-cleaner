export default function TipSection() {
  const handleTip = () => {
    window.open('https://warpcast.com/bluexir', '_blank');
  };

  return (
    <div className="mt-12 pt-8 border-t border-gray-700">
      <div className="text-center max-w-xl mx-auto">
        <h3 className="text-xl font-bold mb-3">Support the Developer</h3>
        <p className="text-gray-400 mb-6">
          If you found this tool useful, consider sending a tip!
        </p>
        <button
          onClick={handleTip}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          💜 Send Warps
        </button>
      </div>
    </div>
  );
}
