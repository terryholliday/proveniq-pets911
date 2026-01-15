import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// NOTE: This page exists primarily so shared links have real OpenGraph metadata.
// Data source is currently mocked (same as /missing board) until DB integration lands.

const MOCK_MISSING_PETS = [
  {
    id: '1',
    name: 'Buddy',
    species: 'DOG',
    breed: 'Golden Retriever',
    color: 'Golden',
    size: 'Large',
    lastSeenDate: '2024-01-03',
    lastSeenLocation: 'Downtown Lewisburg',
    county: 'GREENBRIER',
    description: 'Friendly, wearing blue collar with tags. Responds to name.',
    photoUrl:
      'https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200&h=630&fit=crop',
    status: 'ACTIVE',
    daysAgo: 2,
  },
  {
    id: '2',
    name: 'Whiskers',
    species: 'CAT',
    breed: 'Domestic Shorthair',
    color: 'Orange Tabby',
    size: 'Medium',
    lastSeenDate: '2024-01-02',
    lastSeenLocation: 'East End, Charleston',
    county: 'KANAWHA',
    description: 'Indoor cat, very timid. Has microchip.',
    photoUrl:
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&h=630&fit=crop',
    status: 'ACTIVE',
    daysAgo: 3,
  },
  {
    id: '3',
    name: 'Max',
    species: 'DOG',
    breed: 'German Shepherd',
    color: 'Black and Tan',
    size: 'Large',
    lastSeenDate: '2024-01-01',
    lastSeenLocation: 'White Sulphur Springs',
    county: 'GREENBRIER',
    description: 'Neutered male, no collar. Friendly but may be scared.',
    photoUrl:
      'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=1200&h=630&fit=crop',
    status: 'ACTIVE',
    daysAgo: 4,
  },
  {
    id: '4',
    name: 'Luna',
    species: 'CAT',
    breed: 'Siamese Mix',
    color: 'Cream with dark points',
    size: 'Small',
    lastSeenDate: '2023-12-30',
    lastSeenLocation: 'South Charleston',
    county: 'KANAWHA',
    description: 'Blue eyes, very vocal. Indoor only.',
    photoUrl:
      'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=1200&h=630&fit=crop',
    status: 'ACTIVE',
    daysAgo: 5,
  },
] as const;

type Params = { id: string };

function getBaseUrl() {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  try {
    return new URL(base);
  } catch {
    return new URL('http://localhost:3000');
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const pet = MOCK_MISSING_PETS.find((p) => p.id === id);

  const baseUrl = getBaseUrl();
  const url = new URL(`/missing/${id}`, baseUrl).toString();

  if (!pet) {
    return {
      metadataBase: baseUrl,
      title: 'Missing Pet - Mayday',
      description: 'Missing pet report',
      alternates: { canonical: url },
    };
  }

  const title = `Missing Pet: ${pet.name}`;
  const description = `Have you seen ${pet.name}? Last seen near ${pet.lastSeenLocation}. ${pet.description}`;
  const imageUrl = pet.photoUrl;

  return {
    metadataBase: baseUrl,
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: `${pet.name} (missing pet)`,
            },
          ]
        : [],
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function MissingPetDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const pet = MOCK_MISSING_PETS.find((p) => p.id === id);

  if (!pet) notFound();

  return (
    <main className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/missing" className="text-slate-300 hover:text-white">
            Back
          </Link>
          <div className="text-white font-semibold">Missing Pet</div>
          <div />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex gap-6">
            <div className="w-40 h-40 rounded-xl bg-slate-700 overflow-hidden flex-shrink-0">
              {pet.photoUrl ? (
                <img
                  src={pet.photoUrl}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-white mb-2">{pet.name}</h1>
              <p className="text-slate-300 mb-4">
                {pet.breed} • {pet.color} • {pet.size}
              </p>

              <div className="text-slate-400 mb-4">
                <div>
                  <span className="font-medium text-slate-300">Last seen:</span> {pet.lastSeenLocation}
                </div>
                <div>
                  <span className="font-medium text-slate-300">Reported:</span> {pet.daysAgo} days ago
                </div>
              </div>

              <p className="text-slate-200">{pet.description}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
