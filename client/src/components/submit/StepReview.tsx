import React from 'react';
import { UseFormReturn } from 'react-hook-form';

interface StepReviewProps {
  form: UseFormReturn<any>;
}

export function StepReview({ form }: StepReviewProps) {
  const data = form.getValues();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review Your Submission</h2>
        <p className="text-gray-600">
          Please review your submission before sending. You can go back to edit any section.
        </p>
      </div>

      {/* Writer Info */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold text-lg mb-4 flex items-center">
          <span className="mr-2">👤</span> Writer Info
        </h3>
        <dl className="space-y-2">
          <div className="grid grid-cols-3">
            <dt className="font-medium text-gray-600">Name:</dt>
            <dd className="col-span-2">{data.writerName}</dd>
          </div>
          <div className="grid grid-cols-3">
            <dt className="font-medium text-gray-600">Email:</dt>
            <dd className="col-span-2">{data.writerEmail}</dd>
          </div>
          {data.writerBio && (
            <div className="grid grid-cols-3">
              <dt className="font-medium text-gray-600">Bio:</dt>
              <dd className="col-span-2 text-sm">{data.writerBio}</dd>
            </div>
          )}
          {data.portfolioLinks?.some((link: string) => link) && (
            <div className="grid grid-cols-3">
              <dt className="font-medium text-gray-600">Portfolio:</dt>
              <dd className="col-span-2 text-sm">
                {data.portfolioLinks.filter((link: string) => link).length} link(s) provided
              </dd>
            </div>
          )}
          {(data.socialTwitter || data.socialInstagram) && (
            <div className="grid grid-cols-3">
              <dt className="font-medium text-gray-600">Social:</dt>
              <dd className="col-span-2 text-sm">
                {[data.socialTwitter, data.socialInstagram].filter(Boolean).join(', ')}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Pitch Details */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold text-lg mb-4 flex items-center">
          <span className="mr-2">💡</span> Pitch Details
        </h3>
        <dl className="space-y-3">
          <div>
            <dt className="font-medium text-gray-600 mb-1">Title:</dt>
            <dd className="text-lg font-semibold">{data.pitchTitle}</dd>
          </div>
          <div className="grid grid-cols-3">
            <dt className="font-medium text-gray-600">Category:</dt>
            <dd className="col-span-2">
              <span className="px-3 py-1 bg-black text-white text-xs font-bold uppercase rounded">
                {data.pitchCategory}
              </span>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600 mb-1">Summary:</dt>
            <dd className="text-sm leading-relaxed">{data.pitchSummary}</dd>
          </div>
          {data.whyThisPublication && (
            <div>
              <dt className="font-medium text-gray-600 mb-1">Why Enamorado?</dt>
              <dd className="text-sm leading-relaxed">{data.whyThisPublication}</dd>
            </div>
          )}
          {data.uniqueAngle && (
            <div>
              <dt className="font-medium text-gray-600 mb-1">Unique Angle:</dt>
              <dd className="text-sm">{data.uniqueAngle}</dd>
            </div>
          )}
          {data.targetPublishDate && (
            <div className="grid grid-cols-3">
              <dt className="font-medium text-gray-600">Target Date:</dt>
              <dd className="col-span-2">{new Date(data.targetPublishDate).toLocaleDateString()}</dd>
            </div>
          )}
          {data.exclusiveSubmission && (
            <div className="grid grid-cols-3">
              <dt className="font-medium text-gray-600">Status:</dt>
              <dd className="col-span-2 text-green-600 font-medium">Exclusive Submission</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Writing Sample */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold text-lg mb-4 flex items-center">
          <span className="mr-2">✍️</span> Writing Sample
        </h3>
        <div className="bg-white p-4 rounded border border-gray-200 max-h-64 overflow-y-auto">
          <p className="text-sm leading-relaxed whitespace-pre-wrap font-serif">
            {data.writingSample}
          </p>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          <strong>{data.wordCount || 0}</strong> words · <strong>{data.writingSample?.length || 0}</strong> characters
        </div>
      </div>

      {/* Confirmation */}
      <div className="border-t pt-6">
        <label className="flex items-start cursor-pointer">
          <input
            type="checkbox"
            required
            className="mt-1 mr-3 w-5 h-5"
          />
          <span className="text-sm text-gray-700">
            I confirm that this submission is original work (or properly attributed),
            I have the rights to submit it, and I agree to Enamorado Radio's submission terms.
          </span>
        </label>
      </div>

      {/* What Happens Next */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-2">What happens next?</h4>
        <ul className="text-sm text-blue-900 space-y-1">
          <li>✓ You'll receive an immediate confirmation email</li>
          <li>✓ Our editorial team will review your pitch within 4-6 weeks</li>
          <li>✓ We'll notify you of our decision via email</li>
          <li>✓ If accepted, we'll work with you on editing and publication</li>
        </ul>
      </div>
    </div>
  );
}
