// MissingPetFlyer.tsx
import React from "react";

export type Species = "DOG" | "CAT" | "BIRD" | "OTHER";
export type FlyerTemplate = "classic" | "urgent" | "clean" | "bold" | "modern";

export const FLYER_TEMPLATES: { id: FlyerTemplate; name: string; description: string }[] = [
  { id: "classic", name: "Classic", description: "Traditional red header with tear strips" },
  { id: "urgent", name: "Urgent Alert", description: "High-contrast orange/yellow design" },
  { id: "clean", name: "Clean & Simple", description: "Minimal elegant white design" },
  { id: "bold", name: "Bold Photo", description: "Large photo with overlay text" },
  { id: "modern", name: "Modern Card", description: "Contemporary style with gradients" },
];

export interface FlyerLabels {
  missing: string;
  lastSeen: string;
  date: string;
  species: string;
  breed: string;
  color: string;
  size: string;
  description: string;
  call: string;
  askFor: string;
  reward: string;
  case: string;
  poweredBy: string;
  noPhoto: string;
  missingSpecies: (speciesHeader: string) => string;
}

export const DEFAULT_LABELS: FlyerLabels = {
  missing: "MISSING",
  lastSeen: "LAST SEEN",
  date: "DATE",
  species: "Species",
  breed: "Breed",
  color: "Color",
  size: "Size",
  description: "Description",
  call: "CALL",
  askFor: "Ask for",
  reward: "REWARD",
  case: "Case",
  poweredBy: "Powered by PetNexus Mayday • mayday.petnexus.org",
  noPhoto: "NO PHOTO AVAILABLE",
  missingSpecies: (speciesHeader) => `🚨 MISSING ${speciesHeader} 🚨`,
};

export interface MissingPetFlyerProps {
  petName: string;
  species: Species;
  breed?: string;
  color: string;
  size?: string;
  lastSeenDate: string;
  lastSeenLocation: string;
  description?: string;
  photoUrl?: string;
  contactPhone: string;
  contactName?: string;
  reward?: string;
  caseNumber?: string;
  locale?: string;
  labels?: Partial<FlyerLabels>;
  template?: FlyerTemplate;
}

export interface FlyerDerivedData {
  speciesHeader: string;
  formattedLastSeenDate: string;
}

export function getSpeciesHeader(species: Species) {
  switch (species) {
    case "DOG":
      return "DOG";
    case "CAT":
      return "CAT";
    case "BIRD":
      return "BIRD";
    default:
      return "PET";
  }
}

export function formatLastSeenDate(input: string, locale: string = "en-US") {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

export function deriveFlyerData(props: MissingPetFlyerProps): FlyerDerivedData {
  const locale = props.locale ?? "en-US";
  return {
    speciesHeader: getSpeciesHeader(props.species),
    formattedLastSeenDate: formatLastSeenDate(props.lastSeenDate, locale),
  };
}

// Shared photo component
const FlyerPhoto: React.FC<{ photoUrl?: string; petName: string; noPhotoText: string; className?: string }> = ({
  photoUrl, petName, noPhotoText, className = ""
}) => {
  if (photoUrl) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={photoUrl}
        alt={petName}
        className={`object-cover ${className}`}
        loading="eager"
        decoding="async"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        data-testid="flyer-photo"
      />
    );
  }
  return (
    <div className={`bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-center p-4 ${className}`}>
      {noPhotoText}
    </div>
  );
};

// Tear strips component
const TearStrips: React.FC<{ phone: string; name: string }> = ({ phone, name }) => (
  <div className="hidden print:flex border-t-2 border-dashed border-black" data-testid="tear-strips">
    {Array.from({ length: 7 }).map((_, i) => (
      <div
        key={i}
        className="flex-1 border-r border-dashed border-black px-1 py-2 text-center text-xs"
        style={{ writingMode: "vertical-rl" as const, textOrientation: "mixed" as const, height: "90px" }}
      >
        {phone}{"\n"}{name}
      </div>
    ))}
  </div>
);

// ============================================================================
// TEMPLATE 1: CLASSIC (Red header, traditional style)
// ============================================================================
const ClassicTemplate: React.FC<{
  props: MissingPetFlyerProps;
  derived: FlyerDerivedData;
  L: FlyerLabels;
}> = ({ props, derived, L }) => {
  const { petName, species, breed, color, size, lastSeenLocation, description, photoUrl, contactPhone, contactName, reward, caseNumber } = props;
  const petNameDisplay = (petName ?? "").trim();

  return (
    <>
      <div className="bg-red-600 text-white text-center py-4 px-4">
        <h2 className="text-3xl md:text-4xl font-black tracking-wide">{L.missingSpecies(derived.speciesHeader)}</h2>
      </div>
      <div className="p-4 flex justify-center bg-gray-100">
        <FlyerPhoto photoUrl={photoUrl} petName={petNameDisplay} noPhotoText={L.noPhoto} className="max-h-80 w-auto rounded border-4 border-gray-800" />
      </div>
      <div className="bg-amber-100 border-y-4 border-black py-3 px-4 text-center">
        <h3 className="text-3xl md:text-4xl font-black break-words">&quot;{petNameDisplay.toUpperCase()}&quot;</h3>
      </div>
      <div className="p-5 text-lg leading-relaxed">
        <div className="grid grid-cols-[140px_1fr] gap-y-2">
          <div className="font-bold">{L.species}:</div><div>{species}</div>
          {breed && <><div className="font-bold">{L.breed}:</div><div className="break-words">{breed}</div></>}
          <div className="font-bold">{L.color}:</div><div className="break-words">{color}</div>
          {size && <><div className="font-bold">{L.size}:</div><div className="break-words">{size}</div></>}
          {description && <><div className="font-bold">{L.description}:</div><div className="break-words">{description}</div></>}
        </div>
        <div className="mt-5 bg-yellow-100 p-4 border-2 border-black text-xl">
          <div><span className="font-black">{L.lastSeen}:</span> <span className="break-words">{lastSeenLocation}</span></div>
          <div><span className="font-black">{L.date}:</span> {derived.formattedLastSeenDate}</div>
        </div>
      </div>
      {reward && <div className="bg-green-600 text-white text-center py-3 font-black text-2xl">{L.reward}: {reward}</div>}
      <div className="bg-black text-white text-center py-6">
        <div className="text-3xl font-black break-words">{L.call}: {contactPhone}</div>
        {contactName && <div className="text-lg mt-1">{L.askFor} {contactName}</div>}
      </div>
      <div className="text-center py-3 text-sm text-gray-600 border-t border-gray-200">
        {caseNumber && <>{L.case} #{caseNumber} • </>}{L.poweredBy}
      </div>
      <TearStrips phone={contactPhone} name={petNameDisplay} />
    </>
  );
};

// ============================================================================
// TEMPLATE 2: URGENT (Orange/Yellow high-contrast alert style)
// ============================================================================
const UrgentTemplate: React.FC<{
  props: MissingPetFlyerProps;
  derived: FlyerDerivedData;
  L: FlyerLabels;
}> = ({ props, derived, L }) => {
  const { petName, species, breed, color, size, lastSeenLocation, description, photoUrl, contactPhone, contactName, reward, caseNumber } = props;
  const petNameDisplay = (petName ?? "").trim();

  return (
    <>
      <div className="bg-orange-500 text-white text-center py-6 px-4 border-b-8 border-orange-700">
        <h2 className="text-5xl md:text-6xl font-black tracking-wider drop-shadow-lg">LOST {derived.speciesHeader}</h2>
        <p className="text-xl mt-2 font-bold">PLEASE HELP US FIND OUR PET!</p>
      </div>
      <div className="bg-yellow-400 p-6 flex justify-center">
        <FlyerPhoto photoUrl={photoUrl} petName={petNameDisplay} noPhotoText={L.noPhoto} className="w-72 h-72 rounded-lg border-8 border-black shadow-2xl" />
      </div>
      <div className="bg-black text-yellow-400 py-4 px-4 text-center">
        <h3 className="text-4xl md:text-5xl font-black">{petNameDisplay.toUpperCase()}</h3>
      </div>
      <div className="bg-yellow-100 p-5 text-lg">
        <div className="space-y-2">
          <p><span className="font-black">{L.species}:</span> {species} {breed && `• ${breed}`}</p>
          <p><span className="font-black">{L.color}:</span> {color} {size && `• ${size}`}</p>
          {description && <p><span className="font-black">{L.description}:</span> {description}</p>}
        </div>
        <div className="mt-4 bg-orange-200 p-4 rounded-lg border-4 border-orange-500">
          <p className="font-black text-xl">{L.lastSeen}: {lastSeenLocation}</p>
          <p className="font-bold">{L.date}: {derived.formattedLastSeenDate}</p>
        </div>
      </div>
      {reward && (
        <div className="bg-green-500 text-white text-center py-4 font-black text-3xl border-y-4 border-green-700">
          💰 {L.reward}: {reward} 💰
        </div>
      )}
      <div className="bg-orange-600 text-white text-center py-6">
        <p className="text-2xl font-bold mb-2">IF FOUND, PLEASE CALL:</p>
        <p className="text-4xl font-black">{contactPhone}</p>
        {contactName && <p className="text-lg mt-2">{L.askFor} {contactName}</p>}
      </div>
      <div className="text-center py-2 text-sm text-gray-600 bg-gray-100">
        {caseNumber && <>{L.case} #{caseNumber} • </>}{L.poweredBy}
      </div>
      <TearStrips phone={contactPhone} name={petNameDisplay} />
    </>
  );
};

// ============================================================================
// TEMPLATE 3: CLEAN (Minimal elegant white design)
// ============================================================================
const CleanTemplate: React.FC<{
  props: MissingPetFlyerProps;
  derived: FlyerDerivedData;
  L: FlyerLabels;
}> = ({ props, derived, L }) => {
  const { petName, species, breed, color, size, lastSeenLocation, description, photoUrl, contactPhone, contactName, reward, caseNumber } = props;
  const petNameDisplay = (petName ?? "").trim();

  return (
    <>
      <div className="text-center py-8 px-4 border-b-2 border-gray-200">
        <p className="text-gray-500 text-sm tracking-widest uppercase mb-2">Have You Seen Me?</p>
        <h2 className="text-4xl md:text-5xl font-light text-gray-800">{L.missing}</h2>
      </div>
      <div className="p-8 flex justify-center bg-gray-50">
        <FlyerPhoto photoUrl={photoUrl} petName={petNameDisplay} noPhotoText={L.noPhoto} className="w-80 h-80 rounded-full border-4 border-gray-300 shadow-lg" />
      </div>
      <div className="text-center py-6 px-4">
        <h3 className="text-3xl font-semibold text-gray-800 mb-2">{petNameDisplay}</h3>
        <p className="text-gray-500">{species} {breed && `• ${breed}`} {color && `• ${color}`}</p>
      </div>
      <div className="px-8 pb-6">
        <div className="bg-gray-50 rounded-xl p-6 space-y-3 text-gray-700">
          {size && <p><span className="font-medium">{L.size}:</span> {size}</p>}
          {description && <p><span className="font-medium">{L.description}:</span> {description}</p>}
          <div className="pt-3 border-t border-gray-200">
            <p><span className="font-medium">{L.lastSeen}:</span> {lastSeenLocation}</p>
            <p className="text-sm text-gray-500">{derived.formattedLastSeenDate}</p>
          </div>
        </div>
      </div>
      {reward && (
        <div className="mx-8 mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
          <p className="text-emerald-700 font-medium">{L.reward}: {reward}</p>
        </div>
      )}
      <div className="bg-gray-800 text-white text-center py-8 px-4">
        <p className="text-sm uppercase tracking-wider mb-2 text-gray-400">Please Contact</p>
        <p className="text-3xl font-light">{contactPhone}</p>
        {contactName && <p className="text-gray-400 mt-2">{contactName}</p>}
      </div>
      <div className="text-center py-4 text-xs text-gray-400">
        {caseNumber && <>Case #{caseNumber} • </>}{L.poweredBy}
      </div>
      <TearStrips phone={contactPhone} name={petNameDisplay} />
    </>
  );
};

// ============================================================================
// TEMPLATE 4: BOLD (Large photo with overlay text)
// ============================================================================
const BoldTemplate: React.FC<{
  props: MissingPetFlyerProps;
  derived: FlyerDerivedData;
  L: FlyerLabels;
}> = ({ props, derived, L }) => {
  const { petName, species, breed, color, size, lastSeenLocation, description, photoUrl, contactPhone, contactName, reward, caseNumber } = props;
  const petNameDisplay = (petName ?? "").trim();

  return (
    <>
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-red-600 to-transparent py-6 px-4 z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white text-center drop-shadow-lg">
            LOST {derived.speciesHeader}
          </h2>
        </div>
        <div className="h-96 bg-gray-200">
          {photoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={photoUrl} alt={petNameDisplay} className="w-full h-full object-cover" loading="eager" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl">{L.noPhoto}</div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent py-6 px-4 z-10">
          <h3 className="text-4xl font-black text-white text-center drop-shadow-lg">&quot;{petNameDisplay.toUpperCase()}&quot;</h3>
        </div>
      </div>
      <div className="bg-red-600 text-white p-4 text-center">
        <p className="text-xl font-bold">{species} {breed && `• ${breed}`} {color && `• ${color}`} {size && `• ${size}`}</p>
      </div>
      <div className="p-5 bg-gray-100">
        {description && <p className="text-gray-700 mb-4">{description}</p>}
        <div className="bg-white rounded-lg p-4 border-l-4 border-red-600">
          <p className="font-bold text-lg">{L.lastSeen}</p>
          <p className="text-gray-800">{lastSeenLocation}</p>
          <p className="text-gray-500 text-sm">{derived.formattedLastSeenDate}</p>
        </div>
      </div>
      {reward && (
        <div className="bg-yellow-400 text-black text-center py-4 font-black text-2xl">
          🎁 {L.reward}: {reward}
        </div>
      )}
      <div className="bg-black text-white text-center py-8">
        <p className="text-sm uppercase tracking-wider mb-2 text-gray-400">If Found, Call</p>
        <p className="text-4xl font-black">{contactPhone}</p>
        {contactName && <p className="text-gray-400 mt-2">{L.askFor} {contactName}</p>}
      </div>
      <div className="text-center py-3 text-xs text-gray-500 bg-gray-100">
        {caseNumber && <>Case #{caseNumber} • </>}{L.poweredBy}
      </div>
      <TearStrips phone={contactPhone} name={petNameDisplay} />
    </>
  );
};

// ============================================================================
// TEMPLATE 5: MODERN (Contemporary card style with gradients)
// ============================================================================
const ModernTemplate: React.FC<{
  props: MissingPetFlyerProps;
  derived: FlyerDerivedData;
  L: FlyerLabels;
}> = ({ props, derived, L }) => {
  const { petName, species, breed, color, size, lastSeenLocation, description, photoUrl, contactPhone, contactName, reward, caseNumber } = props;
  const petNameDisplay = (petName ?? "").trim();

  return (
    <>
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-6 px-4">
        <p className="text-sm uppercase tracking-widest opacity-80 mb-1">Help Us Find</p>
        <h2 className="text-4xl md:text-5xl font-black">{petNameDisplay}</h2>
        <p className="mt-2 text-purple-200">{L.missing} {derived.speciesHeader}</p>
      </div>
      <div className="p-6 flex justify-center bg-gradient-to-b from-purple-100 to-white">
        <FlyerPhoto photoUrl={photoUrl} petName={petNameDisplay} noPhotoText={L.noPhoto} className="w-64 h-64 rounded-2xl border-4 border-white shadow-xl" />
      </div>
      <div className="px-6 pb-4">
        <div className="flex flex-wrap gap-2 justify-center">
          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">{species}</span>
          {breed && <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-medium">{breed}</span>}
          {color && <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">{color}</span>}
          {size && <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">{size}</span>}
        </div>
      </div>
      {description && (
        <div className="px-6 pb-4">
          <p className="text-gray-600 text-center">{description}</p>
        </div>
      )}
      <div className="mx-6 mb-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
        <p className="font-bold text-purple-800 flex items-center gap-2">
          <span>📍</span> {L.lastSeen}
        </p>
        <p className="text-gray-800">{lastSeenLocation}</p>
        <p className="text-gray-500 text-sm">{derived.formattedLastSeenDate}</p>
      </div>
      {reward && (
        <div className="mx-6 mb-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-xl p-4 text-center">
          <p className="font-black text-xl">💰 {L.reward}: {reward}</p>
        </div>
      )}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-6 px-4">
        <p className="text-sm uppercase tracking-wider opacity-80 mb-1">Contact Us</p>
        <p className="text-3xl font-black">{contactPhone}</p>
        {contactName && <p className="text-purple-200 mt-1">{contactName}</p>}
      </div>
      <div className="text-center py-3 text-xs text-gray-400 bg-gray-50">
        {caseNumber && <>Case #{caseNumber} • </>}{L.poweredBy}
      </div>
      <TearStrips phone={contactPhone} name={petNameDisplay} />
    </>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const FlyerContent = React.forwardRef<
  HTMLDivElement,
  MissingPetFlyerProps & { derived?: FlyerDerivedData }
>(function FlyerContent(props, ref) {
  const derived = props.derived ?? deriveFlyerData(props);
  const L: FlyerLabels = { ...DEFAULT_LABELS, ...(props.labels ?? {}) };
  const template = props.template ?? "classic";

  return (
    <div
      ref={ref}
      className="flyer bg-white text-black overflow-hidden shadow-xl print:shadow-none"
      data-testid="flyer"
      data-template={template}
    >
      {template === "classic" && <ClassicTemplate props={props} derived={derived} L={L} />}
      {template === "urgent" && <UrgentTemplate props={props} derived={derived} L={L} />}
      {template === "clean" && <CleanTemplate props={props} derived={derived} L={L} />}
      {template === "bold" && <BoldTemplate props={props} derived={derived} L={L} />}
      {template === "modern" && <ModernTemplate props={props} derived={derived} L={L} />}
    </div>
  );
});

export default FlyerContent;