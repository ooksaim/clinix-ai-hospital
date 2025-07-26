export function Footer() {
  return (
    <footer className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-8 px-4 md:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Clinix</h3>
            <p className="text-blue-100 mb-4 max-w-md">
              An AI-powered medical diagnostic tool designed to provide preliminary symptom analysis and healthcare
              guidance.
            </p>
            <div className="text-sm text-blue-100">
              <p className="font-medium">Medical Disclaimer</p>
              <p>
                This AI diagnostic tool is for informational purposes only and is not a substitute for professional
                medical advice, diagnosis, or treatment.
              </p>
            </div>
          </div>
          <div className="md:text-right">
            <h3 className="text-xl font-bold mb-4">About Clinix</h3>
            <p className="text-blue-100">
              Clinix uses advanced AI technology to help users understand their symptoms and make informed healthcare
              decisions.
            </p>
            <p className="text-blue-100 mt-4 text-sm">© {new Date().getFullYear()} Clinix. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
