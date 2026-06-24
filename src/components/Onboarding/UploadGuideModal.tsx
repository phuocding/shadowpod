import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface UploadGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadNow: () => void;
}

export function UploadGuideModal({ isOpen, onClose, onUploadNow }: UploadGuideModalProps) {
  const steps = [
    {
      icon: 'audio_file',
      title: 'Choose audio file',
      description: 'MP3, M4A, WAV up to 10MB',
    },
    {
      icon: 'key',
      title: 'Add your API key (one-time)',
      description: 'Free from deepgram.com • 12,000 mins/year',
      link: {
        text: 'Get free key →',
        url: 'https://deepgram.com',
      },
    },
    {
      icon: 'auto_awesome',
      title: 'Auto-transcribe & practice',
      description: "We'll split audio into sentences for you",
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Your Audio">
      <div className="space-y-6">
        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-4">
              {/* Step Number */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center">
                <span className="text-sm font-bold text-[var(--color-primary)]">
                  {index + 1}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <Icon name={step.icon} size={18} className="text-[var(--color-primary)]" />
                  <h4 className="font-semibold text-[var(--color-text-base)]">
                    {step.title}
                  </h4>
                </div>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {step.description}
                </p>
                {step.link && (
                  <a
                    href={step.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-1 text-sm text-[var(--color-primary)] hover:underline"
                  >
                    {step.link.text}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--color-border-gray)]" />

        {/* Action */}
        <Button onClick={onUploadNow} className="w-full">
          Upload Now
        </Button>
      </div>
    </Modal>
  );
}
