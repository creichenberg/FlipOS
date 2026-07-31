import UploadForm from '@/components/UploadForm';

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-display font-bold">Analyze a listing</h1>
      <p className="mt-1.5 text-ink-soft">
        Paste in a listing from eBay, Facebook Marketplace, Craigslist, OfferUp, or anywhere
        else. Add photos for a sharper condition read.
      </p>
      <UploadForm />
    </div>
  );
}
