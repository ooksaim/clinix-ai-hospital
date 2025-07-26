export function Credits() {
  return (
    <div className="bg-gradient-to-r from-blue-700 to-cyan-700 text-white py-3">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-700"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm md:text-base">
                Developed by GENTS. Students of Nishtar Medical University
              </p>
            </div>
          </div>
          <div className="mt-2 md:mt-0">
            <span className="bg-white text-blue-700 font-bold py-1 px-3 rounded-full text-sm">N-72</span>
          </div>
        </div>
      </div>
    </div>
  )
}
