import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';

interface StepWritingInterfaceProps {
  form: UseFormReturn<any>;
}

export function StepWritingInterface({ form }: StepWritingInterfaceProps) {
  const [activeTab, setActiveTab] = useState<'pitch' | 'sample'>('pitch');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const { register, formState: { errors }, watch, setValue } = form;

  const categories = [
    'Music Review',
    'Artist Profile',
    'Scene Report',
    'Essay',
    'Listicle',
    'Interview',
    'News',
    'Opinion',
  ];

  // Calculate word count for writing sample
  const writingSample = watch('writingSample') || '';
  useEffect(() => {
    const words = writingSample.trim().split(/\s+/).filter(Boolean).length;
    const chars = writingSample.length;
    setWordCount(words);
    setCharCount(chars);
    setValue('wordCount', words);
  }, [writingSample, setValue]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Your Pitch & Writing Sample</h2>
        <p className="text-gray-600">
          Tell us about your story idea and show us your writing style.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b">
        <button
          type="button"
          onClick={() => setActiveTab('pitch')}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
            activeTab === 'pitch'
              ? 'border-black text-black'
              : 'border-transparent text-gray-500 hover:text-black'
          }`}
        >
          Pitch Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sample')}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
            activeTab === 'sample'
              ? 'border-black text-black'
              : 'border-transparent text-gray-500 hover:text-black'
          }`}
        >
          Writing Sample
        </button>
      </div>

      {/* Pitch Tab */}
      {activeTab === 'pitch' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Article Title */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Article Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('pitchTitle')}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="e.g., How Baile Funk Conquered Brooklyn's Underground"
            />
            {errors.pitchTitle && (
              <p className="text-red-600 text-sm mt-1">{errors.pitchTitle.message as string}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              {...register('pitchCategory')}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">Select a category...</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.pitchCategory && (
              <p className="text-red-600 text-sm mt-1">{errors.pitchCategory.message as string}</p>
            )}
          </div>

          {/* Pitch Summary */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Pitch Summary <span className="text-red-500">*</span>
              <span className="text-gray-500 font-normal ml-2">(1000 characters max)</span>
            </label>
            <textarea
              {...register('pitchSummary')}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black h-40 resize-none"
              placeholder="Summarize your article idea. What's the story? Why now?"
            />
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">
                What will you cover? What's your angle?
              </span>
              <span className={`font-medium ${
                (watch('pitchSummary')?.length || 0) > 1000 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {watch('pitchSummary')?.length || 0} / 1000
              </span>
            </div>
            {errors.pitchSummary && (
              <p className="text-red-600 text-sm mt-1">{errors.pitchSummary.message as string}</p>
            )}
          </div>

          {/* Why This Publication */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Why Enamorado Radio? <span className="text-gray-500 font-normal">(500 characters max)</span>
            </label>
            <textarea
              {...register('whyThisPublication')}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black h-24 resize-none"
              placeholder="Why is this story a good fit for our audience?"
            />
            <div className="text-sm text-gray-500 mt-1 text-right">
              {watch('whyThisPublication')?.length || 0} / 500
            </div>
          </div>

          {/* Unique Angle */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Unique Angle <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              {...register('uniqueAngle')}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="What makes your approach different or fresh?"
            />
          </div>

          {/* Target Publish Date & Exclusive */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Target Publish Date <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                type="date"
                {...register('targetPublishDate')}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('exclusiveSubmission')}
                  className="mr-2 w-5 h-5"
                />
                <span className="text-sm font-medium">
                  Exclusive Submission
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Writing Sample Tab */}
      {activeTab === 'sample' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Tip:</strong> Paste a previous article or write a sample piece (300-800 words recommended).
              Show us your voice and style!
            </p>
          </div>

          {/* Writing Area */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold">
                Writing Sample <span className="text-red-500">*</span>
              </label>
              <div className="text-sm space-x-4">
                <span className={`font-medium ${wordCount < 100 ? 'text-red-600' : 'text-green-600'}`}>
                  {wordCount} words
                </span>
                <span className="text-gray-500">
                  {charCount} characters
                </span>
              </div>
            </div>

            <textarea
              {...register('writingSample')}
              className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-serif text-base leading-relaxed resize-none"
              style={{ height: '500px' }}
              placeholder="Start writing here, or paste an existing piece...

This is your chance to show us your writing style. We're looking for:
• Clear, engaging prose
• A distinct voice
• Attention to detail
• Cultural insight"
            />

            {errors.writingSample && (
              <p className="text-red-600 text-sm mt-1">{errors.writingSample.message as string}</p>
            )}
          </div>

          {/* Writing Tips */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2">What We Look For:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ Strong opening hook</li>
              <li>✓ Clear structure and flow</li>
              <li>✓ Cultural awareness and context</li>
              <li>✓ Original perspective</li>
              <li>✓ Clean, polished writing</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
