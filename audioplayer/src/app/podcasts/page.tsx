"use client";

import { PlayableFeed } from "@/components/PlayableFeed";
import BottomNav from '@/components/common/bottom-nav';


// --- DATA STRUCTURES ---

interface Release {
  name: string;
  type: string;
  year: number;
  image: string;
  href: string;
}

interface HomeCardItem {
  name: string;
  href: string;
  image: string;
}

// --- DATA ARRAYS ---

const masiaOneReleases: Release[] = [
  { name: "Wine Pon It (Asian Version)", type: "Single", year: 2025, image: "https://i.scdn.co/image/ab67616d00001e02cdc0ad8059ea760bd4e03615", href: "/playlist?autoplay=true" },
  { name: "Wait in Vain", type: "Single", year: 2022, image: "https://i.scdn.co/image/ab67616d00001e02d09eaf1660d837b910654bd1", href: "/playlist?autoplay=true" },
  { name: "Far East Empress", type: "Album", year: 2018, image: "https://i.scdn.co/image/ab67616d00001e02abb430589c27c9c87a97f554", href: "/playlist?autoplay=true" },
  { name: "88 Vibes", type: "Single", year: 2022, image: "https://i.scdn.co/image/ab67616d00001e0242329e4c5ae163c20c8a09cc", href: "/playlist?autoplay=true" },
  { name: "Bootleg Culture Remixed", type: "Album", year: 2013, image: "https://i.scdn.co/image/ab67616d00001e028e8df4b8baaa1913a9f25388", href: "/playlist?autoplay=true" },
  { name: "Bootleg Culture", type: "Album", year: 2012, image: "https://i.scdn.co/image/ab67616d00001e02537a4cbff48b6e48795fa482", href: "/playlist?autoplay=true" },
];

const homeCards: HomeCardItem[] = [
  { name: "History (feat. James Blake)", href: "track/6OakIaj4T039vJ8V2AJiWa.html", image: "https://i.scdn.co/image/ab67616d00001e02fecaa7826bb0cbe139a8cb83" },
  { name: "Rain Down (Feat. Sampha)", href: "track/41QBVReXFSAIXWnyChAJCH.html", image: "https://i.scdn.co/image/ab67616d00001e0247bcac7a04ff11294c50a044" },
  { name: "CHANEL", href: "track/4VxTzYm00mg82MuoT35Ja7.html", image: "https://i.scdn.co/image/ab67616d00001e02d7c3bef89364a9d6d9d7d78b" },
  { name: "Who’s Dat Girl", href: "track/6XaN4trfoMvRFEy8HoB4nC.html", image: "https://i.scdn.co/image/ab67616d00001e020b2ac553094996786771b49c" },
  { name: "LOVER GIRL", href: "track/3t6kNqWEd1CPE2nPz6wcQg.html", image: "https://i.scdn.co/image/ab67616d00001e024b6cc70c9274f6a125fc3ae9" },
  { name: "Catchi Yoh Whine", href: "track/1H8bWAkucKINTrOaovslR9.html", image: "https://i.scdn.co/image/ab67616d00001e0293c49d62703915ffe5367b3d" },
  { name: "Pendana Nawe", href: "track/77zoMfoWzE17LkOfLGqu5A.html", image: "https://i.scdn.co/image/ab67616d00001e02ffff230590c5104a4375aaef" },
  { name: "MAYOO", href: "track/0UGIdREkw9Xn2ZoO5V2YAs.html", image: "https://i.scdn.co/image/ab67616d00001e02551f9dd16f8bf6fb0f4a97cf" },
  { name: "Mental", href: "track/1hsU6vRCu1IjxxypmjgyPX.html", image: "https://i.scdn.co/image/ab67616d00001e021400f3799ed3130bbf28a444" },
  { name: "Backbencher", href: "track/040zksag8ezHjbAN6aSAQY.html", image: "https://i.scdn.co/image/ab67616d00001e0264b602bfbbd786c18847816d" },
  { name: "HIM (feat. Gunna)", href: "track/3YaLrZQLOggK3fPxUAihUW.html", image: "https://i.scdn.co/image/ab67616d00001e02572480611adc36e68c6a6c87" },
  { name: "My Muse", href: "track/0F5UB64eoJrGX14e8GwVLH.html", image: "https://i.scdn.co/image/ab67616d00001e02fe6c938381e8ef1b06efa4c6" },
  { name: "Donjo Maber", href: "track/0Qiy6PYDxjkkvB7e5KfHtk.html", image: "https://i.scdn.co/image/ab67616d00001e02e0a36c0b17bc49ea61867cd3" },
  { name: "M.O.T.O", href: "track/13RrmTzCsknCAV7jb1hPnx.html", image: "https://i.scdn.co/image/ab67616d00001e029cb3114254829241d211cb84" },
  { name: "Watu Wazima", href: "track/5N8eMuyG9y2QZpH7x4CCM8.html", image: "https://i.scdn.co/image/ab67616d00001e028ef319c19f86f3600640ed30" },
  { name: "Shakabulizzy - Remix", href: "track/3yzs58LteW16AjEb4J5vvi.html", image: "https://i.scdn.co/image/ab67616d00001e0254cbc5f22668f434ec002a20" },
  { name: "know about me (feat. GloRilla)", href: "track/6ThcmoM9ZXYyNDm7AqtGTY.html", image: "https://i.scdn.co/image/ab67616d00001e027108ec73b6bc2a2541aa22c0" },
  { name: "Kum Baba", href: "track/3azzdc9ogl4fZLASwWOXQ8.html", image: "https://i.scdn.co/image/ab67616d00001e02beef93c2649ec9c3a7d587bd" },
  { name: "BODY (danz)", href: "track/51WcemyU0PlssXhhsspBYh.html", image: "https://i.scdn.co/image/ab67616d00001e027767b24c4297d8a5b92c3209" },
];

const trendingSongs = [
    // ... (original data kept for brevity)
    { name: "Nyaduse", artist: "KODONGKLAN", image: "https://i.scdn.co/image/ab67616d00001e028b684f5d1926c65e14a83231", href: "/playlist?autoplay=true" },
    { name: "Digi Digi", artist: "Abongo Jakabwana", image: "https://i.scdn.co/image/ab67616d00001e02ba9ad74e367e3b4d2229593a", href: "/playlist?autoplay=true" },
    { name: "Nani", artist: "Diamond Platnumz", image: "https://i.scdn.co/image/ab67616d00001e02b613cd1b434af1c426f2eb58", href: "/playlist?autoplay=true" },
    { name: "I'm a mess - Choir Version", artist: "Urban Chords", image: "https://i.scdn.co/image/ab67616d00001e025638a5776d3412a20cd4f9b3", href: "/playlist?autoplay=true" },
    { name: "M.O.T.O", artist: "X.O, SUNS3T", image: "https://i.scdn.co/image/ab67616d00001e029cb3114254829241d211cb84", href: "/playlist?autoplay=true" },
];

const popularArtists = [
    // ... (original data kept for brevity)
    { name: "Escaladizzy", artist: "Escaladizzy", image: "https://i.scdn.co/image/ab67616d00001e0235893bb4df71439deafe7958", href: "/playlist?autoplay=true" },
    { name: "Rumours", artist: "Rumours", image: "https://i.scdn.co/image/ab67616d00001e02a18ae82cd4f66b83b275c709", href: "/playlist?autoplay=true" },
    { name: "So Easy (To Fall In Love)", artist: "So Easy (To Fall In Love)", image: "https://i.scdn.co/image/ab67616d00001e029a336bfb6d40bbd90a507417", href: "/playlist?autoplay=true" },
];

// --- INTERNAL COMPONENT FOR REUSABILITY ---

const ReleaseCard = ({ item }: { item: Release }) => (
	<div data-testid="card-mwp" className="kA80EEMeb6NCIQBHtQhw">
        <a draggable={false} href={item.href} className="flex flex-col h-full">
            <div className="G77D17YmCvxbuAYWhBCv">
                <img
                    aria-hidden={false}
                    draggable={false}
                    loading="lazy"
                    src={item.image}
                    alt={item.name}
                    className="LBM25IAoFtd0wh7k3EGM"
                    width="100%"
                    height="100%"
                />
            </div>
            <span
                className="e-91000-text encore-text-body-small-bold"
                data-encore-id="text"
                style={{ paddingBlockEnd: 'var(--spacer8)' }}
            >
                {item.name}
            </span>
            <div
                className="e-91000-text encore-text-marginal encore-internal-color-text-subdued GeE0lzbH6FU0AvBG5Hxo"
                data-encore-id="text"
            >
                {item.type} • {item.year}
            </div>
        </a>
    </div>
);

// --- NEW HOME CARD COMPONENT ---

const HomeCard = ({ item }: { item: HomeCardItem }) => (
    <div
        className="e-91000-box e-91000-baseline e-91000-box--naked e-91000-box--interactive e-91000-box--browser-default-focus e-91000-box--is-using-keyboard e-91000-box--padding-custom e-91000-Box-sc-1njtxi4-0 faRaKi Ji04otv4EkRALLN2jLQA Box-sc-1njtxi4-0 faRaKi Ji04otv4EkRALLN2jLQA"
        style={{ '--box-padding-block-start': '8px', '--box-padding-block-end': '8px', '--box-padding-inline-start': '8px', '--box-padding-inline-end': '8px' } as React.CSSProperties}
        data-encore-id="card"
        role="group"
        aria-labelledby={`card-title-home-card-spotify:track:${item.name.replace(/[^a-zA-Z0-9]/g, '')}`}
        data-testid="home-card"
    >
        <div className="CardLink-sc-1ut6cns-0 DjiIj"></div>
        <div style={{ display: 'none' }} id={`onClickHinthome-card-spotify:track:${item.name.replace(/[^a-zA-Z0-9]/g, '')}`}></div>
        <img
            alt=""
            style={{ minInlineSize: '152px' }}
            data-encore-id="image"
            src={item.image}
            className="Image-sc-1u215sg-3 kOChlU"
        />
        <div className="Areas__InteractiveArea-sc-1tea2mc-0 Areas__MainArea-sc-1tea2mc-1 MWEhk kLALqL">
            <div className="Areas__InteractiveArea-sc-1tea2mc-0 Areas__Column-sc-1tea2mc-2 MWEhk cuoMqc">
                <a
                    className="e-91000-text encore-text-body-medium ListRowTitle__ListRowText-sc-1xe2if1-1 eFGzcP"
                    data-encore-id="listRowTitle"
                    href={item.href}
                    title={item.name}
                >
                    <span className="ListRowTitle__LineClamp-sc-1xe2if1-0 lmgIvZ">{item.name}</span>
                </a>
            </div>
        </div>
    </div>
);


// --- MAIN COMPONENT WITH NEW JSX STRUCTURE ---
export default function PodcastsPage() {
  return (
    <div className="mobile-web-player bg-neutral-900 text-white">

      <main className="CSaMX7iuf9huVVwuAHPq">
        
        <div className="p-4">
          
          {/* Section 1: Masia One Popular Releases (Retained) */}
          <div className="CSaMX7iuf9huVVwuAHPq">
            <div className="DhawDdzZTKsiueS03eWj">
              <div
                className="e-91000-box e-91000-baseline e-91000-box--naked e-91000-box--browser-default-focus e-91000-box--padding-custom e-91000-box--min-size"
                style={{ '--box-padding': '0', '--box-min-block-size': '56px' } as React.CSSProperties}
                role="group"
                aria-labelledby="listrow-title-header-only"
                data-testid="list-row-shelf-header"
              >
                <div className="Areas__HeaderSideArea-sc-8gfrea-1">
                  <div className="Areas__HeaderSideAreaFlexContainer-sc-8gfrea-2">
                    <img
                      alt=""
                      className="Image-sc-1u215sg-3 ListRowImage__ListRowImageComponent-sc-1uaxq9n-0 M8dU9Qw2nUunF7rsYk_D"
                      src="https://i.scdn.co/image/ab6761610000f1784b5b6c5c8dea646e8ae19108"
                    />
                  </div>
                </div>
                <div className="Areas__HeaderArea-sc-8gfrea-3">
                  <div className="Areas__InteractiveArea-sc-8gfrea-0 Areas__Column-sc-8gfrea-5">
                    <p className="e-91000-text encore-text-body-small encore-internal-color-text-subdued ListRowTitle__ListRowText-sc-1xe2if1-1" data-encore-id="listRowTitle" id="listrow-title-header-only">Popular releases</p>
                    <p className="e-91000-text encore-text-title-small encore-internal-color-text-base ListRowTitle__ListRowText-sc-1xe2if1-1" data-encore-id="listRowTitle" id="listrow-title-header-only">Masia One</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="IMTJOmdA6OKJYZVzOGlv" data-testid="carousel-mwp">
              {masiaOneReleases.map((item, index) => (
                <ReleaseCard key={index} item={item} />
              ))}
            </div>
          </div>
          
          {/* --- NEW SECTION: Home Cards Carousel (Based on second HTML block) --- */}
          <div className="mt-8 mb-7">
            <h2 className="text-white text-2xl font-bold mb-4">Trending Tracks</h2>
            <div 
              className="IMTJOmdA6OKJYZVzOGlv" 
              data-testid="carousel-mwp" 
              style={{ '--gap': '0', '--fullbleed-margin': '8px' } as React.CSSProperties}
            >
              {homeCards.map((item, index) => (
                <HomeCard key={index} item={item} />
              ))}
            </div>
          </div>
          
          {/* Section 3: Generic PlayableFeeds (Retained) */}
          <div className="mt-8 mb-7">
            <PlayableFeed title="Trending songs" items={trendingSongs} />
            <PlayableFeed title="Popular artists" items={popularArtists} />
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}