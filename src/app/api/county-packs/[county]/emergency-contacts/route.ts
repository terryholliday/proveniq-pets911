import { NextResponse } from 'next/server';
import type { EmergencyContact } from '@/lib/types';

/**
 * GET /api/county-packs/[county]/emergency-contacts
 * Returns emergency contacts for a specific county
 * 
 * TODO: Connect to Supabase backend
 * FAIL-CLOSED: Returns 503 if backend unavailable
 */
export async function GET(
  request: Request,
  { params }: { params: { county: string } }
) {
  try {
    const { county } = params;
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type');
    const acceptsEmergency = searchParams.get('accepts_emergency');

    // Mock data for Greenbrier County, WV
    const greenbrierContacts: EmergencyContact[] = [
      {
        id: 'vet-greenbrier-1',
        county_pack_id: 'greenbrier-v1',
        contact_type: 'ER_VET',
        name: 'Greenbrier Veterinary Emergency Clinic',
        phone_primary: '+1-304-645-7800',
        phone_secondary: '+1-304-645-7801',
        email: 'emergency@greenbriervet.com',
        address: '300 Maplewood Ave, Lewisburg, WV 24901',
        is_24_hour: true,
        accepts_emergency: true,
        accepts_wildlife: false,
        accepts_livestock: false,
        hours: {
          monday: '24 hours',
          tuesday: '24 hours',
          wednesday: '24 hours',
          thursday: '24 hours',
          friday: '24 hours',
          saturday: '24 hours',
          sunday: '24 hours'
        },
      },
      {
        id: 'vet-greenbrier-2',
        county_pack_id: 'greenbrier-v1',
        contact_type: 'ER_VET',
        name: 'Lewisburg Animal Hospital',
        phone_primary: '+1-304-645-1332',
        phone_secondary: null,
        email: 'info@lewisburganimalhospital.com',
        address: '109 Court St N, Lewisburg, WV 24901',
        is_24_hour: false,
        accepts_emergency: true,
        accepts_wildlife: false,
        accepts_livestock: false,
        hours: {
          monday: '8am-6pm',
          tuesday: '8am-6pm',
          wednesday: '8am-6pm',
          thursday: '8am-6pm',
          friday: '8am-6pm',
          saturday: '9am-2pm',
          sunday: 'Closed'
        },
      },
      {
        id: 'vet-greenbrier-3',
        county_pack_id: 'greenbrier-v1',
        contact_type: 'ER_VET',
        name: 'Seneca Trail Animal Hospital',
        phone_primary: '+1-304-645-1600',
        phone_secondary: '+1-304-645-1601',
        email: 'senecatrailvet@gmail.com',
        address: '439 Seneca Trail, Ronceverte, WV 24970',
        is_24_hour: false,
        accepts_emergency: true,
        accepts_wildlife: false,
        accepts_livestock: false,
        hours: {
          monday: '8am-6pm',
          tuesday: '8am-6pm',
          wednesday: '8am-6pm',
          thursday: '8am-6pm',
          friday: '8am-6pm',
          saturday: '9am-1pm',
          sunday: 'Closed'
        },
      },
      {
        id: 'aco-greenbrier-1',
        county_pack_id: 'greenbrier-v1',
        contact_type: 'ANIMAL_CONTROL',
        name: 'Greenbrier County Humane Society',
        phone_primary: '+1-304-645-4772',
        phone_secondary: '+1-304-645-6425',
        email: 'greenbrierhumanesociety@gmail.com',
        address: '255 C&O Drive, Lewisburg, WV 24901',
        is_24_hour: false,
        accepts_emergency: true,
        accepts_wildlife: true,
        accepts_livestock: true,
        hours: {
          monday: '11am-4pm',
          tuesday: '11am-4pm',
          wednesday: '11am-4pm',
          thursday: '11am-4pm',
          friday: '11am-4pm',
          saturday: '11am-4pm',
          sunday: 'Closed'
        },
      },
      {
        id: 'aco-greenbrier-2',
        county_pack_id: 'greenbrier-v1',
        contact_type: 'ANIMAL_CONTROL',
        name: 'Greenbrier County Sheriff\'s Office - Animal Control',
        phone_primary: '+1-304-647-6634',
        phone_secondary: '+1-304-647-6635',
        email: 'animalcontrol@greenbriercounty.com',
        address: '200 N Court St, Lewisburg, WV 24901',
        is_24_hour: true,
        accepts_emergency: true,
        accepts_wildlife: true,
        accepts_livestock: true,
        hours: {
          monday: '24 hours',
          tuesday: '24 hours',
          wednesday: '24 hours',
          thursday: '24 hours',
          friday: '24 hours',
          saturday: '24 hours',
          sunday: '24 hours'
        },
      }
    ];

    // Mock data for Kanawha County, WV
    const kanawhaContacts: EmergencyContact[] = [
      {
        id: 'vet-kanawha-1',
        county_pack_id: 'kanawha-v1',
        contact_type: 'ER_VET',
        name: 'Charleston Veterinary Emergency & Critical Care',
        phone_primary: '+1-304-342-5900',
        phone_secondary: '+1-304-915-9595',
        email: 'info@charlestonveterinaryemergency.com',
        address: '301 Virginia St E, Charleston, WV 25301',
        is_24_hour: true,
        accepts_emergency: true,
        accepts_wildlife: false,
        accepts_livestock: false,
        hours: {
          monday: '24 hours',
          tuesday: '24 hours',
          wednesday: '24 hours',
          thursday: '24 hours',
          friday: '24 hours',
          saturday: '24 hours',
          sunday: '24 hours'
        },
      },
      {
        id: 'vet-kanawha-002',
        county_pack_id: 'kanawha-v1',
        contact_type: 'ER_VET',
        name: 'Kanawha Valley Veterinary Hospital',
        phone_primary: '+1-304-925-1761',
        phone_secondary: null,
        email: 'kanawhavalleyvet@gmail.com',
        address: '4130 MacCorkle Ave SE, Charleston, WV 25304',
        is_24_hour: false,
        accepts_emergency: true,
        accepts_wildlife: false,
        accepts_livestock: false,
        hours: {
          monday: '8am-7pm',
          tuesday: '8am-7pm',
          wednesday: '8am-7pm',
          thursday: '8am-7pm',
          friday: '8am-7pm',
          saturday: '9am-3pm',
          sunday: 'Closed'
        },
      },
      {
        id: 'vet-kanawha-003',
        county_pack_id: 'kanawha-v1',
        contact_type: 'ER_VET',
        name: 'South Charleston Animal Hospital',
        phone_primary: '+1-304-744-4242',
        phone_secondary: null,
        email: 'scah@southcharlestonvet.com',
        address: '5913 MacCorkle Ave SW, South Charleston, WV 25309',
        is_24_hour: false,
        accepts_emergency: true,
        accepts_wildlife: false,
        accepts_livestock: false,
        hours: {
          monday: '8am-6pm',
          tuesday: '8am-6pm',
          wednesday: '8am-6pm',
          thursday: '8am-6pm',
          friday: '8am-6pm',
          saturday: '9am-1pm',
          sunday: 'Closed'
        },
      },
      {
        id: 'vet-kanawha-004',
        county_pack_id: 'kanawha-v1',
        contact_type: 'ER_VET',
        name: 'Valley Veterinary Hospital',
        phone_primary: '+1-304-343-4664',
        phone_secondary: '+1-304-343-4665',
        email: 'info@valleyvethospital.com',
        address: '1 Valley Veterinary Dr, South Charleston, WV 25309',
        is_24_hour: false,
        accepts_emergency: true,
        accepts_wildlife: false,
        accepts_livestock: false,
        hours: {
          monday: '8am-6pm',
          tuesday: '8am-6pm',
          wednesday: '8am-6pm',
          thursday: '8am-6pm',
          friday: '8am-6pm',
          saturday: '8am-12pm',
          sunday: 'Closed'
        },
      },
      {
        id: 'vet-kanawha-005',
        county_pack_id: 'kanawha-v1',
        contact_type: 'ER_VET',
        name: 'Teays Valley Pet Care Center',
        phone_primary: '+1-304-757-VETS (8387)',
        phone_secondary: '+1-304-757-0974',
        email: 'info@teaysvalleypetcare.com',
        address: '5735 Teays Valley Rd, Hurricane, WV 25526',
        is_24_hour: false,
        accepts_emergency: true,
        accepts_wildlife: false,
        accepts_livestock: false,
        hours: {
          monday: '8am-7pm',
          tuesday: '8am-7pm',
          wednesday: '8am-7pm',
          thursday: '8am-7pm',
          friday: '8am-7pm',
          saturday: '9am-3pm',
          sunday: 'Closed'
        },
      },
      {
        id: 'vet-kanawha-006',
        county_pack_id: 'kanawha-v1',
        contact_type: 'ER_VET',
        name: 'St. Albans Veterinary Hospital',
        phone_primary: '+1-304-727-5251',
        phone_secondary: null,
        email: 'stalbansvet@gmail.com',
        address: '2100 MacCorkle Ave SW, St. Albans, WV 25177',
        is_24_hour: false,
        accepts_emergency: true,
        accepts_wildlife: false,
        accepts_livestock: false,
        hours: {
          monday: '8am-6pm',
          tuesday: '8am-6pm',
          wednesday: '8am-6pm',
          thursday: '8am-6pm',
          friday: '8am-6pm',
          saturday: '9am-1pm',
          sunday: 'Closed'
        },
      },
      {
        id: 'vet-kanawha-007',
        county_pack_id: 'kanawha-v1',
        contact_type: 'ER_VET',
        name: 'Cross Lanes Animal Hospital',
        phone_primary: '+1-304-776-6777',
        phone_secondary: null,
        email: 'info@crosslanesanimalhospital.com',
        address: '5110 Big Tyler Rd, Cross Lanes, WV 25313',
        is_24_hour: false,
        accepts_emergency: true,
        accepts_wildlife: false,
        accepts_livestock: false,
        hours: {
          monday: '8am-6pm',
          tuesday: '8am-6pm',
          wednesday: '8am-6pm',
          thursday: '8am-6pm',
          friday: '8am-6pm',
          saturday: '9am-1pm',
          sunday: 'Closed'
        },
      },
      {
        id: 'vet-kanawha-008',
        county_pack_id: 'kanawha-v1',
        contact_type: 'ER_VET',
        name: 'Elkview Animal Hospital',
        phone_primary: '+1-304-965-8355',
        phone_secondary: '+1-304-965-8356',
        email: 'elkviewanimalhospital@aol.com',
        address: '5539 Elk River Rd N, Elkview, WV 25071',
        is_24_hour: false,
        accepts_emergency: true,
        accepts_wildlife: false,
        accepts_livestock: false,
        hours: {
          monday: '8am-6pm',
          tuesday: '8am-6pm',
          wednesday: '8am-6pm',
          thursday: '8am-6pm',
          friday: '8am-6pm',
          saturday: '9am-12pm',
          sunday: 'Closed'
        },
      },
      {
        id: 'vet-kanawha-009',
        county_pack_id: 'kanawha-v1',
        contact_type: 'ER_VET',
        name: 'Winfield Animal Hospital',
        phone_primary: '+1-304-755-1222',
        phone_secondary: null,
        email: 'winfieldanimalhospital@gmail.com',
        address: '6024 Winfield Rd, Winfield, WV 25213',
        is_24_hour: false,
        accepts_emergency: true,
        accepts_wildlife: false,
        accepts_livestock: false,
        hours: {
          monday: '8am-6pm',
          tuesday: '8am-6pm',
          wednesday: '8am-6pm',
          thursday: '8am-6pm',
          friday: '8am-6pm',
          saturday: '9am-1pm',
          sunday: 'Closed'
        },
      },
      {
        id: 'vet-kanawha-010',
        county_pack_id: 'kanawha-v1',
        contact_type: 'ER_VET',
        name: 'Putnam County Emergency Vet',
        phone_primary: '+1-304-757-VETS (8387)',
        phone_secondary: '+1-304-757-0974',
        email: 'emergency@putnamvet.com',
        address: '5400 Teays Valley Rd, Hurricane, WV 25526',
        is_24_hour: true,
        accepts_emergency: true,
        accepts_wildlife: false,
        accepts_livestock: false,
        hours: {
          monday: '24 hours',
          tuesday: '24 hours',
          wednesday: '24 hours',
          thursday: '24 hours',
          friday: '24 hours',
          saturday: '24 hours',
          sunday: '24 hours'
        },
      },
      {
        id: 'aco-kanawha-1',
        county_pack_id: 'kanawha-1',
        contact_type: 'ANIMAL_CONTROL',
        name: 'Kanawha-Charleston Humane Association',
        phone_primary: '+1-304-342-1576',
        phone_secondary: '+1-304-342-8845',
        email: 'kcha@kcharleston.org',
        address: '1241 Greenbrier St, Charleston, WV 25311',
        is_24_hour: false,
        accepts_emergency: true,
        accepts_wildlife: true,
        accepts_livestock: false,
        hours: {
          monday: '11am-5pm',
          tuesday: '11am-5pm',
          wednesday: '11am-5pm',
          thursday: '11am-5pm',
          friday: '11am-5pm',
          saturday: '11am-5pm',
          sunday: 'Closed'
        },
      },
      {
        id: 'aco-kanawha-2',
        county_pack_id: 'kanawha-v1',
        contact_type: 'ANIMAL_CONTROL',
        name: 'Kanawha County Sheriff\'s Office - Animal Control',
        phone_primary: '+1-304-357-0160',
        phone_secondary: '+1-304-357-0161',
        email: 'animalcontrol@kanawhasheriff.us',
        address: '401 Virginia St E, Charleston, WV 25301',
        is_24_hour: true,
        accepts_emergency: true,
        accepts_wildlife: true,
        accepts_livestock: true,
        hours: {
          monday: '24 hours',
          tuesday: '24 hours',
          wednesday: '24 hours',
          thursday: '24 hours',
          friday: '24 hours',
          saturday: '24 hours',
          sunday: '24 hours'
        },
      }
    ];

    // Get contacts for the requested county
    let contacts: EmergencyContact[] = [];
    if (county.toUpperCase() === 'GREENBRIER') {
      contacts = greenbrierContacts;
    } else if (county.toUpperCase() === 'KANAWHA') {
      contacts = kanawhaContacts;
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'COUNTY_NOT_FOUND',
            message: `County '${county}' not supported. Available: GREENBRIER, KANAWHA`,
          },
          meta: {
            request_id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    // Apply filters
    if (type) {
      contacts = contacts.filter(c => c.contact_type === type);
    }
    
    if (acceptsEmergency !== null) {
      const accepts = acceptsEmergency === 'true';
      contacts = contacts.filter(c => c.accepts_emergency === accepts);
    }

    return NextResponse.json({
      success: true,
      data: { contacts },
      meta: {
        request_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        county: county.toUpperCase(),
        total_contacts: contacts.length,
      },
    });

  } catch (error) {
    console.error('Emergency contacts fetch error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Emergency contacts service temporarily unavailable. Please try again later.',
        },
        meta: {
          request_id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        },
      },
      { status: 503 }
    );
  }
}
