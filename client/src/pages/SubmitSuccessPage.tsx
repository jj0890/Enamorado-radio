import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function SubmitSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="bg-white rounded-lg shadow-md p-12">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />

          <h1 className="text-3xl font-bold mb-4">Submission Received!</h1>

          <p className="text-lg text-gray-700 mb-6">
            Thank you for submitting your pitch to Enamorado Radio. We're excited to read your work!
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-semibold mb-3">What's Next?</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Check your email for a confirmation message</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Our editorial team will review your submission within 4-6 weeks</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>We'll reach out via email with our decision</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>If accepted, we'll work with you on editing and publication details</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <Link
              to="/editorial"
              className="inline-block px-8 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Explore Our Editorial
            </Link>

            <div>
              <Link
                to="/"
                className="text-gray-600 hover:text-black underline"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-8 text-sm text-gray-600">
          Questions about your submission?{' '}
          <a href="mailto:editorial@enamoradoradio.com" className="underline">
            Email us
          </a>
        </p>
      </div>
    </div>
  );
}
