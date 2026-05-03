import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { StepWriterInfo } from '../components/submit/StepWriterInfo';
import { StepWritingInterface } from '../components/submit/StepWritingInterface';
import { StepReview } from '../components/submit/StepReview';

const submissionSchema = z.object({
  // Step 1: Writer Info
  writerName: z.string().min(2, 'Name required'),
  writerEmail: z.string().email('Valid email required'),
  writerBio: z.string().max(500, 'Max 500 characters').optional(),
  portfolioLinks: z.array(z.string().url()).max(5).optional(),
  socialTwitter: z.string().optional(),
  socialInstagram: z.string().optional(),

  // Step 2: Pitch & Writing
  pitchTitle: z.string().min(10, 'Title too short'),
  pitchCategory: z.string().min(1, 'Category required'),
  pitchSummary: z.string().min(50, 'Summary too short').max(1000, 'Summary too long'),
  whyThisPublication: z.string().max(500).optional(),
  uniqueAngle: z.string().optional(),
  writingSample: z.string().min(100, 'Writing sample too short'),
  wordCount: z.number().optional(),
  targetPublishDate: z.string().optional(),
  exclusiveSubmission: z.boolean().default(false),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

export default function SubmitPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      exclusiveSubmission: false,
      portfolioLinks: ['', '', ''],
    },
  });

  const steps = [
    { num: 1, title: 'About You', icon: '👤' },
    { num: 2, title: 'Your Pitch & Writing', icon: '✍️' },
    { num: 3, title: 'Review', icon: '✓' },
  ];

  const onSubmit = async (data: SubmissionFormData) => {
    setSubmitting(true);

    try {
      // Filter out empty portfolio links
      const portfolioLinks = data.portfolioLinks?.filter(link => link.trim() !== '') || [];

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          portfolioLinks,
          socialLinks: {
            twitter: data.socialTwitter,
            instagram: data.socialInstagram,
          },
          writingSampleText: data.writingSample,
        }),
      });

      const result = await response.json();

      if (result.ok) {
        // Redirect to success page
        navigate('/submit/success');
      } else {
        alert('Submission failed: ' + result.error);
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Submit to Enamorado</h1>
          <p className="text-gray-600">
            Share your voice with our community. We review all submissions within 4-6 weeks.
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="flex justify-between mb-8 max-w-md mx-auto">
          {steps.map((s, idx) => (
            <div key={s.num} className="flex-1 flex items-center">
              <div className="flex-1 flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all ${
                    step >= s.num
                      ? 'bg-black text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step > s.num ? '✓' : s.icon}
                </div>
                <div className={`text-xs mt-2 font-medium ${
                  step >= s.num ? 'text-black' : 'text-gray-400'
                }`}>
                  {s.title}
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-0.5 flex-1 -mx-2 mt-6 ${
                  step > s.num ? 'bg-black' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Steps */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {step === 1 && <StepWriterInfo form={form} />}
            {step === 2 && <StepWritingInterface form={form} />}
            {step === 3 && <StepReview form={form} />}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-8 border-t">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  ← Back
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    // Validate current step before proceeding
                    if (step === 1) {
                      form.trigger(['writerName', 'writerEmail']).then(isValid => {
                        if (isValid) setStep(step + 1);
                      });
                    } else {
                      form.trigger(['pitchTitle', 'pitchCategory', 'pitchSummary', 'writingSample']).then(isValid => {
                        if (isValid) setStep(step + 1);
                      });
                    }
                  }}
                  className="ml-auto px-8 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="ml-auto px-8 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Pitch'}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Questions? Email <a href="mailto:editorial@enamoradoradio.com" className="underline">editorial@enamoradoradio.com</a></p>
        </div>
      </div>
    </div>
  );
}
