import UploadForm from '@/components/UploadForm';

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Analyze a listing</h1>
      <p className="mt-1 text-sm text-graphite">
        Paste in a listing from eBay, Facebook Marketplace, Craigslist, OfferUp, or anywhere
        else. Add photos for a sharper condition read.
      </p>
      <UploadForm />
    </div>
  );
}
