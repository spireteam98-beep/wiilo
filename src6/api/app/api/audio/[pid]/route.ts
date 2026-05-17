import { NextResponse } from 'next/server';

const BBC_STATIONS = [
  "bbc_1xtra",
  "bbc_radio_one",
  "bbc_radio_one_anthems",
  "bbc_radio_one_dance",
  "bbc_radio_two",
  "bbc_radio_three",
  "bbc_radio_three_unwind",
  "bbc_radio_four",
  "bbc_radio_four_extra",
  "bbc_radio_five_live",
  "bbc_radio_five_live_sports_extra",
  "bbc_6music",
  "bbc_asian_network",
  "bbc_world_service"
];

export async function GET(
  request: Request,
  { params }: { params: { pid: string } }
) {
  const pid = params.pid;
  
  try {
    // Validate if it's a valid BBC station
    if (!BBC_STATIONS.includes(pid)) {
      return new NextResponse('Invalid station ID', { status: 400 });
    }

    // Using BBC's URN format
    const manifestData = {
      media_assets: [
        {
          kind: "audio",
          bitrate: "128kbps",
          url: `urn:bbc:sounds:play:${pid}`,
          duration: 3600 // 1 hour for live radio
        }
      ],
      duration: 3600,
      pid: pid,
      urn: `urn:bbc:radio:${pid}`,
      title: pid.split('_').join(' ').toUpperCase(),
      type: "live_stream"
    };

    return NextResponse.json(manifestData);
    
  } catch (error) {
    console.error('Error fetching audio manifest:', error);
    return new NextResponse('Error fetching audio manifest', { status: 500 });
  }
} 