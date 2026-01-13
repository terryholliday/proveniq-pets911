'use client';

import { useState } from 'react';
import Link from 'next/link';

const COUNTY_DATA = [
  { county: 'Barbour', agency: 'Dog Warden', facility: 'Barbour County Animal Control', notes: 'Follows state code; 5-day hold', harboring: '5-day', pet911Score: 'C', phone: '(304) 823-1330', email: '', address: 'Philippi, WV 26416' },
  { county: 'Berkeley', agency: 'Animal Control (County)', facility: 'Berkeley County Animal Shelter', notes: '3-day harboring rule; progressive TNR policy', harboring: '3-day', pet911Score: 'B', phone: '(304) 267-8889', email: 'animalcontrol@berkeleywv.org', address: '554 Dry Run Rd, Martinsburg, WV 25404' },
  { county: 'Boone', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 369-9913', email: '', address: 'Madison, WV 25130' },
  { county: 'Braxton', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 765-2335', email: '', address: 'Sutton, WV 26601' },
  { county: 'Brooke', agency: 'Dog Warden', facility: 'Brooke County Animal Shelter', notes: 'Strict leash law; zero tolerance cruelty', harboring: '5-day', pet911Score: 'B', phone: '(304) 737-3660', email: 'brookeanimalshelter@gmail.com', address: '101 Shelter Rd, Wellsburg, WV 26070' },
  { county: 'Cabell', agency: 'HCW Control Board', facility: 'Huntington Cabell Wayne Shelter', notes: 'Joint Authority; 5-day hold; $50 reclaim', harboring: '5-day', pet911Score: 'A', phone: '(304) 526-4455', email: 'hcwacs@gmail.com', address: '1901 James River Rd, Huntington, WV 25704' },
  { county: 'Calhoun', agency: 'Sheriff Dept', facility: 'No dedicated shelter', notes: 'Transport to neighboring facilities required', harboring: '5-day', pet911Score: 'F', phone: '(304) 354-6118', email: '', address: 'Grantsville, WV 26147' },
  { county: 'Clay', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 587-4260', email: '', address: 'Clay, WV 25043' },
  { county: 'Doddridge', agency: 'Humane Officer', facility: 'County Contract', notes: 'Roles consolidated with law enforcement', harboring: '5-day', pet911Score: 'C', phone: '(304) 873-2631', email: '', address: 'West Union, WV 26456' },
  { county: 'Fayette', agency: 'Animal Control', facility: 'County Shelter', notes: 'Oak Hill has 3-day "fed or sheltered" rule', harboring: '3-day', pet911Score: 'C', phone: '(304) 574-1200', email: '', address: 'Fayetteville, WV 25840' },
  { county: 'Gilmer', agency: 'Sheriff / Warden', facility: 'No dedicated shelter', notes: 'Glenville has chaining/tying laws', harboring: '5-day', pet911Score: 'F', phone: '(304) 462-7454', email: '', address: 'Glenville, WV 26351' },
  { county: 'Grant', agency: 'Assessor/Warden', facility: 'County Pound', notes: 'Strict license tax collection ($3/$6)', harboring: '5-day', pet911Score: 'C', phone: '(304) 257-4422', email: '', address: 'Petersburg, WV 26847' },
  { county: 'Greenbrier', agency: 'Humane Society', facility: 'Greenbrier Humane Society', notes: 'Strong partnership with private humane society', harboring: '5-day', pet911Score: 'B', phone: '(304) 645-4775', email: 'ghs@greenbrierhumanesociety.com', address: '151 Holiday Lane, Lewisburg, WV 24901' },
  { county: 'Hampshire', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 822-3114', email: '', address: 'Romney, WV 26757' },
  { county: 'Hancock', agency: 'Dog Warden', facility: 'Hancock County Animal Shelter', notes: 'Emergency service; focus on cruelty/neglect', harboring: '5-day', pet911Score: 'B', phone: '(304) 564-3311', email: '', address: 'New Cumberland, WV 26047' },
  { county: 'Hardy', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 530-0222', email: '', address: 'Moorefield, WV 26836' },
  { county: 'Harrison', agency: 'Dog Warden', facility: 'Harrison County Animal Control', notes: 'MANDATORY MICROCHIPPING for reclaims', harboring: '5-day', pet911Score: 'A', phone: '(304) 423-7760', email: 'hcac@harrisoncountywv.com', address: '279 W Main St, Clarksburg, WV 26301' },
  { county: 'Jackson', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 372-2290', email: '', address: 'Ripley, WV 25271' },
  { county: 'Jefferson', agency: 'Animal Control', facility: 'Animal Welfare Society', notes: 'High compliance; strong licensing ($3/$6)', harboring: '5-day', pet911Score: 'A', phone: '(304) 725-0589', email: 'info@baacwv.org', address: '60 Eastwood Dr, Kearneysville, WV 25430' },
  { county: 'Kanawha', agency: 'KCHA', facility: 'KCHA Shelter', notes: 'ANTI-TETHERING; adoption reservation system', harboring: '5-day', pet911Score: 'A+', phone: '(304) 342-1576', email: 'info@kchaonline.org', address: '1248 Greenbrier St, Charleston, WV 25311' },
  { county: 'Lewis', agency: 'Sheriff / Warden', facility: 'Lewis-Upshur Facility', notes: 'Shared facility with Upshur', harboring: '5-day', pet911Score: 'C', phone: '(304) 269-8251', email: '', address: 'Weston, WV 26452' },
  { county: 'Lincoln', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 824-3336', email: '', address: 'Hamlin, WV 25523' },
  { county: 'Logan', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 792-8520', email: '', address: 'Logan, WV 25601' },
  { county: 'Marion', agency: 'Humane Society', facility: 'Marion County Humane Society', notes: 'NO-KILL facility; strong adoption focus', harboring: '5-day', pet911Score: 'A', phone: '(304) 366-1098', email: 'mchumanesociety@gmail.com', address: '2731 Locust Ave, Fairmont, WV 26554' },
  { county: 'Marshall', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 845-1600', email: '', address: 'Moundsville, WV 26041' },
  { county: 'Mason', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 675-3838', email: '', address: 'Point Pleasant, WV 25550' },
  { county: 'McDowell', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 436-8531', email: '', address: 'Welch, WV 24801' },
  { county: 'Mercer', agency: 'Animal Control', facility: 'Mercer County Animal Shelter', notes: '15-DAY HARBORING (Gold Standard); Spay/Neuter ordinance', harboring: '15-day', pet911Score: 'A+', phone: '(304) 425-2838', email: 'mcas@mercercounty.wv.gov', address: '614 Glenwood Park Rd, Princeton, WV 24740' },
  { county: 'Mineral', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 788-1314', email: '', address: 'Keyser, WV 26726' },
  { county: 'Mingo', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 235-0360', email: '', address: 'Williamson, WV 25661' },
  { county: 'Monongalia', agency: 'Canine Adoption Ctr', facility: 'Canine Adoption Center', notes: '3-day harboring; strict weather tethering bans', harboring: '3-day', pet911Score: 'B', phone: '(304) 291-7267', email: 'mccac@monongaliacounty.gov', address: '351 S Pierpont St, Morgantown, WV 26501' },
  { county: 'Monroe', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 772-3018', email: '', address: 'Union, WV 24983' },
  { county: 'Morgan', agency: 'Animal Control', facility: 'County Shelter', notes: 'Focus on outdoor enclosure standards', harboring: '5-day', pet911Score: 'C', phone: '(304) 258-8546', email: '', address: 'Berkeley Springs, WV 25411' },
  { county: 'Nicholas', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 872-7850', email: '', address: 'Summersville, WV 26651' },
  { county: 'Ohio', agency: 'SPCA / Warden', facility: 'Ohio County SPCA', notes: 'Vicious dog and noise ordinances', harboring: '5-day', pet911Score: 'B', phone: '(304) 232-1922', email: 'ohiocountyspca@gmail.com', address: '3 Orchard Rd, Wheeling, WV 26003' },
  { county: 'Pendleton', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 358-2214', email: '', address: 'Franklin, WV 26807' },
  { county: 'Pleasants', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 684-2234', email: '', address: 'St Marys, WV 26170' },
  { county: 'Pocahontas', agency: 'Sheriff (Designee)', facility: 'Pocahontas County Animal Shelter', notes: 'Sheriff designates wardens; focus on leash laws', harboring: '5-day', pet911Score: 'C', phone: '(304) 799-4445', email: '', address: 'Marlinton, WV 24954' },
  { county: 'Preston', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 329-0070', email: '', address: 'Kingwood, WV 26537' },
  { county: 'Putnam', agency: 'Animal Services', facility: 'Putnam County Animal Shelter', notes: '"Adopt a Kennel" program; sustainable care', harboring: '5-day', pet911Score: 'B', phone: '(304) 586-0249', email: 'putnamcountyanimalshelter@gmail.com', address: '1 Armory Dr, Eleanor, WV 25070' },
  { county: 'Raleigh', agency: 'Sheriff / Warden', facility: 'Raleigh County Humane Society', notes: '"One dog at large per 12hr" rule', harboring: '5-day', pet911Score: 'B', phone: '(304) 253-8921', email: '', address: '325 Gray Flats Rd, Beckley, WV 25801' },
  { county: 'Randolph', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 636-2100', email: '', address: 'Elkins, WV 26241' },
  { county: 'Ritchie', agency: 'Humane Society', facility: 'Ritchie County Humane Society', notes: 'Contracted shelter services', harboring: '5-day', pet911Score: 'C', phone: '(304) 643-4721', email: '', address: 'Harrisville, WV 26362' },
  { county: 'Roane', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 927-2860', email: '', address: 'Spencer, WV 25276' },
  { county: 'Summers', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 466-3155', email: '', address: 'Hinton, WV 25951' },
  { county: 'Taylor', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 265-3365', email: '', address: 'Grafton, WV 26354' },
  { county: 'Tucker', agency: 'Dog Warden', facility: 'Tucker County Dog Pound', notes: 'Basic pound services; limited hours', harboring: '5-day', pet911Score: 'D', phone: '(304) 478-2913', email: '', address: 'Parsons, WV 26287' },
  { county: 'Tyler', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Defaults to State Code', harboring: '5-day', pet911Score: 'D', phone: '(304) 758-2141', email: '', address: 'Middlebourne, WV 26149' },
  { county: 'Upshur', agency: 'Warden', facility: 'Lewis-Upshur Facility', notes: 'Shared facility with Lewis', harboring: '5-day', pet911Score: 'C', phone: '(304) 472-1180', email: '', address: 'Buckhannon, WV 26201' },
  { county: 'Wayne', agency: 'HCW Control Board', facility: 'Huntington Cabell Wayne Shelter', notes: 'Joint Authority with Cabell', harboring: '5-day', pet911Score: 'A', phone: '(304) 526-4455', email: 'hcwacs@gmail.com', address: '1901 James River Rd, Huntington, WV 25704' },
  { county: 'Webster', agency: 'City Control', facility: 'City of Webster Control', notes: 'City-level control; 3-day harboring implied', harboring: '3-day', pet911Score: 'C', phone: '(304) 847-2423', email: '', address: 'Webster Springs, WV 26288' },
  { county: 'Wetzel', agency: 'Animal Shelter', facility: 'Wetzel County Animal Shelter', notes: 'Basic shelter operations', harboring: '5-day', pet911Score: 'C', phone: '(304) 455-2510', email: '', address: 'New Martinsville, WV 26155' },
  { county: 'Wirt', agency: 'Sheriff / Warden', facility: 'No dedicated shelter', notes: 'New leash law (2025); reliance on Sheriff', harboring: '5-day', pet911Score: 'F', phone: '(304) 275-4200', email: '', address: 'Elizabeth, WV 26143' },
  { county: 'Wood', agency: 'Humane Society', facility: 'HS of Parkersburg', notes: 'Privatized enforcement; police powers', harboring: '5-day', pet911Score: 'A', phone: '(304) 422-5541', email: 'info@hspwv.org', address: '530 29th St, Parkersburg, WV 26101' },
  { county: 'Wyoming', agency: 'Sheriff / Warden', facility: 'County Shelter', notes: 'Nuisance animal focus', harboring: '5-day', pet911Score: 'D', phone: '(304) 732-8000', email: '', address: 'Pineville, WV 24874' },
];

const SHELTER_RESCUE_DATA = [
  // Greenbrier County
  { county: 'Greenbrier', name: 'Greenbrier Humane Society', type: 'Humane Society', phone: '(304) 645-4775', email: 'ghs@greenbrierhumanesociety.com', address: '151 Holiday Lane, Lewisburg, WV 24901', website: 'greenbrierhumanesociety.com', services: ['Adoption', 'Surrender', 'Spay/Neuter', 'Low-Cost Clinic'] },
  { county: 'Greenbrier', name: 'Almost Home Animal Rescue', type: 'Rescue', phone: '(304) 645-1807', email: '', address: 'Lewisburg, WV 24901', website: '', services: ['Foster Network', 'Adoption'] },
  
  // Kanawha County
  { county: 'Kanawha', name: 'Kanawha Charleston Humane Association', type: 'Humane Society', phone: '(304) 342-1576', email: 'info@kchaonline.org', address: '1248 Greenbrier St, Charleston, WV 25311', website: 'kchaonline.org', services: ['Adoption', 'Surrender', 'Spay/Neuter', 'Behavior Training'] },
  { county: 'Kanawha', name: 'Manna Meal Pet Pantry', type: 'Support', phone: '(304) 345-7121', email: '', address: 'Charleston, WV 25301', website: '', services: ['Pet Food Bank', 'Emergency Supplies'] },
  { county: 'Kanawha', name: 'FUR (Friends United for Reform)', type: 'Rescue', phone: '', email: 'furwv@gmail.com', address: 'Charleston, WV', website: '', services: ['TNR', 'Feral Cat Program'] },
  
  // Cabell County
  { county: 'Cabell', name: 'Huntington Cabell Wayne Animal Shelter', type: 'Shelter', phone: '(304) 526-4455', email: 'hcwacs@gmail.com', address: '1901 James River Rd, Huntington, WV 25704', website: '', services: ['Adoption', 'Stray Intake', 'Lost & Found'] },
  { county: 'Cabell', name: 'Patches Place', type: 'Rescue', phone: '(304) 429-7387', email: '', address: 'Huntington, WV 25701', website: '', services: ['Cat Rescue', 'TNR'] },
  { county: 'Cabell', name: 'Grateful Acres Farm Sanctuary', type: 'Sanctuary', phone: '(681) 235-4578', email: 'gratefulacresfarm@gmail.com', address: 'Huntington, WV', website: 'gratefulacresfarm.org', services: ['Farm Animals', 'Education'] },
  
  // Mercer County
  { county: 'Mercer', name: 'Mercer County Animal Shelter', type: 'Shelter', phone: '(304) 425-2838', email: 'mcas@mercercounty.wv.gov', address: '614 Glenwood Park Rd, Princeton, WV 24740', website: '', services: ['Adoption', 'Stray Intake', 'Spay/Neuter Vouchers'] },
  { county: 'Mercer', name: 'Mercer County Humane Society', type: 'Humane Society', phone: '(304) 425-9727', email: '', address: 'Princeton, WV 24740', website: '', services: ['Adoption', 'Foster Program'] },
  
  // Wood County
  { county: 'Wood', name: 'Humane Society of Parkersburg', type: 'Humane Society', phone: '(304) 422-5541', email: 'info@hspwv.org', address: '530 29th St, Parkersburg, WV 26101', website: 'hspwv.org', services: ['Adoption', 'Surrender', 'Spay/Neuter', 'Humane Education'] },
  { county: 'Wood', name: 'Mid-Ohio Valley Feline Friends', type: 'Rescue', phone: '', email: 'movff@yahoo.com', address: 'Parkersburg, WV', website: '', services: ['Cat Rescue', 'TNR', 'Adoption'] },
  
  // Marion County
  { county: 'Marion', name: 'Marion County Humane Society', type: 'Humane Society', phone: '(304) 366-1098', email: 'mchumanesociety@gmail.com', address: '2731 Locust Ave, Fairmont, WV 26554', website: '', services: ['Adoption', 'Surrender', 'No-Kill'] },
  
  // Harrison County
  { county: 'Harrison', name: 'Harrison County Humane Society', type: 'Humane Society', phone: '(304) 592-1800', email: '', address: 'Clarksburg, WV 26301', website: 'hchs-wv.org', services: ['Adoption', 'Foster', 'Education'] },
  { county: 'Harrison', name: 'Almost Heaven Animal Rescue', type: 'Rescue', phone: '(304) 931-4677', email: 'almostheavenrescue@gmail.com', address: 'Clarksburg, WV', website: '', services: ['Dog Rescue', 'Transport'] },
  
  // Monongalia County
  { county: 'Monongalia', name: 'Morgantown Canine Adoption Center', type: 'Shelter', phone: '(304) 291-7267', email: 'mccac@monongaliacounty.gov', address: '351 S Pierpont St, Morgantown, WV 26501', website: '', services: ['Adoption', 'Stray Intake', 'Lost & Found'] },
  { county: 'Monongalia', name: 'Mon County Animal Rescue', type: 'Rescue', phone: '', email: 'moncountyanimalrescue@gmail.com', address: 'Morgantown, WV', website: '', services: ['Foster Network', 'Transport'] },
  { county: 'Monongalia', name: 'Kitty Corner Rescue', type: 'Rescue', phone: '(304) 296-5261', email: '', address: 'Morgantown, WV 26501', website: '', services: ['Cat Rescue', 'Adoption'] },
  
  // Berkeley County
  { county: 'Berkeley', name: 'Berkeley County Humane Society', type: 'Humane Society', phone: '(304) 267-8389', email: '', address: 'Martinsburg, WV 25404', website: 'bchumanesocietywv.org', services: ['Adoption', 'Foster', 'Spay/Neuter'] },
  { county: 'Berkeley', name: 'SPCA of the Eastern Panhandle', type: 'SPCA', phone: '(304) 262-8050', email: '', address: 'Martinsburg, WV 25401', website: 'spcaep.org', services: ['Low-Cost Clinic', 'TNR', 'Spay/Neuter'] },
  
  // Jefferson County
  { county: 'Jefferson', name: 'Briggs Animal Adoption Center', type: 'Shelter', phone: '(304) 725-0589', email: 'info@baacwv.org', address: '60 Eastwood Dr, Kearneysville, WV 25430', website: 'baacwv.org', services: ['Adoption', 'Surrender', 'Lost & Found'] },
  { county: 'Jefferson', name: 'National Humane Education Society', type: 'Sanctuary', phone: '(304) 725-0506', email: '', address: 'Charles Town, WV 25414', website: 'nhes.org', services: ['Sanctuary', 'Education', 'Adoption'] },
  
  // Ohio County
  { county: 'Ohio', name: 'Ohio County SPCA', type: 'SPCA', phone: '(304) 232-1922', email: 'ohiocountyspca@gmail.com', address: '3 Orchard Rd, Wheeling, WV 26003', website: '', services: ['Adoption', 'Stray Intake', 'Cruelty Investigation'] },
  { county: 'Ohio', name: 'Wheeling Animal Control', type: 'Municipal', phone: '(304) 234-3798', email: '', address: 'Wheeling, WV 26003', website: '', services: ['Stray Pickup', 'Cruelty Response'] },
  
  // Raleigh County
  { county: 'Raleigh', name: 'Raleigh County Humane Society', type: 'Humane Society', phone: '(304) 253-8921', email: '', address: '325 Gray Flats Rd, Beckley, WV 25801', website: 'rchumanesociety.com', services: ['Adoption', 'Surrender', 'Low-Cost Clinic'] },
  { county: 'Raleigh', name: 'New River Humane Society', type: 'Rescue', phone: '(304) 252-5562', email: '', address: 'Beckley, WV 25801', website: '', services: ['Adoption', 'Foster'] },
  
  // Putnam County
  { county: 'Putnam', name: 'Putnam County Animal Shelter', type: 'Shelter', phone: '(304) 586-0249', email: 'putnamcountyanimalshelter@gmail.com', address: '1 Armory Dr, Eleanor, WV 25070', website: '', services: ['Adoption', 'Stray Intake', 'Adopt-a-Kennel'] },
  
  // Brooke County
  { county: 'Brooke', name: 'Brooke County Animal Shelter', type: 'Shelter', phone: '(304) 737-3660', email: 'brookeanimalshelter@gmail.com', address: '101 Shelter Rd, Wellsburg, WV 26070', website: '', services: ['Adoption', 'Stray Intake'] },
  
  // Hancock County
  { county: 'Hancock', name: 'Hancock County Animal Shelter', type: 'Shelter', phone: '(304) 564-3311', email: '', address: 'New Cumberland, WV 26047', website: '', services: ['Adoption', 'Stray Intake', 'Cruelty Investigation'] },
  
  // Wayne County
  { county: 'Wayne', name: 'Huntington Cabell Wayne Animal Shelter', type: 'Shelter', phone: '(304) 526-4455', email: 'hcwacs@gmail.com', address: '1901 James River Rd, Huntington, WV 25704', website: '', services: ['Adoption', 'Stray Intake', 'Joint Authority'] },
  
  // Fayette County
  { county: 'Fayette', name: 'Fayette County Animal Control', type: 'Shelter', phone: '(304) 574-1200', email: '', address: 'Fayetteville, WV 25840', website: '', services: ['Stray Intake', 'Adoption'] },
  { county: 'Fayette', name: 'New River Animal Advocates', type: 'Rescue', phone: '', email: 'newriveranimaladvocates@gmail.com', address: 'Fayetteville, WV', website: '', services: ['Rescue', 'Foster', 'Transport'] },
  
  // Logan County
  { county: 'Logan', name: 'Logan County Animal Shelter', type: 'Shelter', phone: '(304) 792-8520', email: '', address: 'Logan, WV 25601', website: '', services: ['Stray Intake', 'Adoption'] },
  { county: 'Logan', name: 'Pawsitive Change Rescue', type: 'Rescue', phone: '', email: 'pawsitivechangewv@gmail.com', address: 'Logan, WV', website: '', services: ['Foster', 'Adoption', 'Transport'] },
  
  // McDowell County
  { county: 'McDowell', name: 'McDowell County Animal Shelter', type: 'Shelter', phone: '(304) 436-8531', email: '', address: 'Welch, WV 24801', website: '', services: ['Stray Intake'] },
  { county: 'McDowell', name: 'Mountain State Animal Rescue', type: 'Rescue', phone: '', email: '', address: 'Welch, WV', website: '', services: ['Rescue', 'Transport'] },
  
  // Randolph County
  { county: 'Randolph', name: 'Randolph County Humane Society', type: 'Humane Society', phone: '(304) 636-5580', email: '', address: 'Elkins, WV 26241', website: '', services: ['Adoption', 'Foster'] },
  
  // Upshur County
  { county: 'Upshur', name: 'Upshur County Animal Shelter', type: 'Shelter', phone: '(304) 472-1180', email: '', address: 'Buckhannon, WV 26201', website: '', services: ['Stray Intake', 'Adoption'] },
  { county: 'Upshur', name: 'Buckwheat Animal Rescue', type: 'Rescue', phone: '', email: 'buckwheatanimalrescue@gmail.com', address: 'Buckhannon, WV', website: '', services: ['Rescue', 'Foster'] },
  
  // Lewis County
  { county: 'Lewis', name: 'Lewis-Upshur Animal Control', type: 'Shelter', phone: '(304) 269-8251', email: '', address: 'Weston, WV 26452', website: '', services: ['Stray Intake', 'Shared Facility'] },
  
  // Wetzel County
  { county: 'Wetzel', name: 'Wetzel County Animal Shelter', type: 'Shelter', phone: '(304) 455-2510', email: '', address: 'New Martinsville, WV 26155', website: '', services: ['Stray Intake', 'Adoption'] },
  
  // Preston County
  { county: 'Preston', name: 'Preston County Animal Shelter', type: 'Shelter', phone: '(304) 329-0070', email: '', address: 'Kingwood, WV 26537', website: '', services: ['Stray Intake'] },
  
  // Mineral County
  { county: 'Mineral', name: 'Mineral County Animal Control', type: 'Shelter', phone: '(304) 788-1314', email: '', address: 'Keyser, WV 26726', website: '', services: ['Stray Intake'] },
  
  // Grant County
  { county: 'Grant', name: 'Grant County Dog Pound', type: 'Pound', phone: '(304) 257-4422', email: '', address: 'Petersburg, WV 26847', website: '', services: ['Stray Intake'] },
  
  // Hardy County
  { county: 'Hardy', name: 'Hardy County Animal Control', type: 'Shelter', phone: '(304) 530-0222', email: '', address: 'Moorefield, WV 26836', website: '', services: ['Stray Intake'] },
  
  // Hampshire County
  { county: 'Hampshire', name: 'Hampshire County Animal Control', type: 'Shelter', phone: '(304) 822-3114', email: '', address: 'Romney, WV 26757', website: '', services: ['Stray Intake'] },
  
  // Morgan County
  { county: 'Morgan', name: 'Morgan County Animal Shelter', type: 'Shelter', phone: '(304) 258-8546', email: '', address: 'Berkeley Springs, WV 25411', website: '', services: ['Stray Intake', 'Adoption'] },
  
  // Pocahontas County
  { county: 'Pocahontas', name: 'Pocahontas County Animal Shelter', type: 'Shelter', phone: '(304) 799-4445', email: '', address: 'Marlinton, WV 24954', website: '', services: ['Stray Intake'] },
  
  // Tucker County  
  { county: 'Tucker', name: 'Tucker County Dog Pound', type: 'Pound', phone: '(304) 478-2913', email: '', address: 'Parsons, WV 26287', website: '', services: ['Stray Intake'] },
  
  // Statewide Organizations
  { county: 'Statewide', name: 'WV Spay Neuter Assistance Program', type: 'Support', phone: '(304) 965-9999', email: 'wvsnap@yahoo.com', address: 'Statewide', website: 'wvsnap.org', services: ['Low-Cost Spay/Neuter', 'Vouchers', 'Transport'] },
  { county: 'Statewide', name: 'Almost Heaven Golden Retriever Rescue', type: 'Breed Rescue', phone: '', email: 'info@ahgrr.org', address: 'Statewide', website: 'ahgrr.org', services: ['Golden Retriever Rescue'] },
  { county: 'Statewide', name: 'WV Boxer Rescue', type: 'Breed Rescue', phone: '', email: 'wvboxerrescue@gmail.com', address: 'Statewide', website: '', services: ['Boxer Rescue'] },
  { county: 'Statewide', name: 'Appalachian Great Pyrenees Rescue', type: 'Breed Rescue', phone: '', email: 'agpr@gmail.com', address: 'Statewide', website: '', services: ['Great Pyrenees Rescue'] },
];

const COMPLIANCE_PILLARS = [
  { id: 'scanning', name: 'Universal Scanning', icon: '📡', description: 'Every animal scanned for microchip upon intake' },
  { id: 'digital', name: 'Digital Transparency', icon: '📱', description: 'Photos posted online within 24 hours of intake' },
  { id: 'holding', name: 'Extended Holding', icon: '⏳', description: '5+ day hold with adoption reservation' },
  { id: 'immunity', name: 'Finder Immunity', icon: '🛡️', description: '14+ day safe harbor for Good Samaritans' },
];

const SCORE_COLORS: Record<string, string> = {
  'A+': 'bg-green-600 text-white',
  'A': 'bg-green-700 text-white',
  'B': 'bg-blue-700 text-white',
  'C': 'bg-yellow-700 text-black',
  'D': 'bg-orange-700 text-white',
  'F': 'bg-red-700 text-white',
};

const TYPE_COLORS: Record<string, string> = {
  'Shelter': 'bg-blue-900 text-blue-300',
  'Humane Society': 'bg-green-900 text-green-300',
  'Rescue': 'bg-purple-900 text-purple-300',
  'SPCA': 'bg-cyan-900 text-cyan-300',
  'Sanctuary': 'bg-amber-900 text-amber-300',
  'Support': 'bg-pink-900 text-pink-300',
  'Municipal': 'bg-zinc-700 text-zinc-300',
  'Pound': 'bg-zinc-800 text-zinc-400',
  'Breed Rescue': 'bg-indigo-900 text-indigo-300',
};

type SortKey = 'name' | 'county' | 'type' | 'phone' | 'email' | 'address';
type SortDir = 'asc' | 'desc';

function SheltersTab() {
  const [searchShelter, setSearchShelter] = useState('');
  const [filterCounty, setFilterCounty] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('county');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const counties = [...new Set(SHELTER_RESCUE_DATA.map(s => s.county))].sort();
  const types = [...new Set(SHELTER_RESCUE_DATA.map(s => s.type))].sort();

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filteredShelters = SHELTER_RESCUE_DATA
    .filter(s => {
      if (searchShelter && !s.name.toLowerCase().includes(searchShelter.toLowerCase()) && 
          !s.county.toLowerCase().includes(searchShelter.toLowerCase())) return false;
      if (filterCounty && s.county !== filterCounty) return false;
      if (filterType && s.type !== filterType) return false;
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortKey]?.toLowerCase() || '';
      const bVal = b[sortKey]?.toLowerCase() || '';
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const stats = {
    total: SHELTER_RESCUE_DATA.length,
    shelters: SHELTER_RESCUE_DATA.filter(s => s.type === 'Shelter').length,
    humaneSocieties: SHELTER_RESCUE_DATA.filter(s => s.type === 'Humane Society').length,
    rescues: SHELTER_RESCUE_DATA.filter(s => s.type === 'Rescue').length,
    countiesServed: new Set(SHELTER_RESCUE_DATA.map(s => s.county)).size - 1, // minus Statewide
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{stats.total}</div>
          <div className="text-xs text-zinc-500">Total Organizations</div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.shelters}</div>
          <div className="text-xs text-zinc-500">Shelters</div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.humaneSocieties}</div>
          <div className="text-xs text-zinc-500">Humane Societies</div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.rescues}</div>
          <div className="text-xs text-zinc-500">Rescues</div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-zinc-300">{stats.countiesServed}</div>
          <div className="text-xs text-zinc-500">Counties Covered</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="🔍 Search organization or county..."
          value={searchShelter}
          onChange={(e) => setSearchShelter(e.target.value)}
          className="flex-1 min-w-[200px] max-w-sm bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm"
        />
        <select
          value={filterCounty || ''}
          onChange={(e) => setFilterCounty(e.target.value || null)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Counties</option>
          {counties.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filterType || ''}
          onChange={(e) => setFilterType(e.target.value || null)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="text-sm text-zinc-500">{filteredShelters.length} organizations</span>
      </div>

      {/* Table */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead className="bg-zinc-900/80">
            <tr className="text-left text-xs text-zinc-400 uppercase">
              <th className="px-3 py-3 cursor-pointer hover:text-zinc-200 select-none" onClick={() => handleSort('name')}>
                Organization {sortKey === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-3 py-3 cursor-pointer hover:text-zinc-200 select-none" onClick={() => handleSort('county')}>
                County {sortKey === 'county' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-3 py-3 cursor-pointer hover:text-zinc-200 select-none min-w-[120px]" onClick={() => handleSort('type')}>
                Type {sortKey === 'type' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-3 py-3 cursor-pointer hover:text-zinc-200 select-none whitespace-nowrap min-w-[120px]" onClick={() => handleSort('phone')}>
                📞 Phone {sortKey === 'phone' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-3 py-3 cursor-pointer hover:text-zinc-200 select-none" onClick={() => handleSort('email')}>
                ✉️ Email {sortKey === 'email' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-3 py-3 cursor-pointer hover:text-zinc-200 select-none" onClick={() => handleSort('address')}>
                📍 Address {sortKey === 'address' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-3 py-3 w-[140px]">Services</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filteredShelters.map((org, idx) => (
              <tr key={`${org.county}-${org.name}-${idx}`} className="hover:bg-zinc-900/50">
                <td className="px-3 py-4">
                  <div className="font-medium">{org.name}</div>
                  {org.website && (
                    <a href={`https://${org.website}`} target="_blank" rel="noopener noreferrer" 
                       className="text-xs text-blue-400 hover:underline">{org.website}</a>
                  )}
                </td>
                <td className="px-3 py-4 text-zinc-300">{org.county}</td>
                <td className="px-3 py-4">
                  <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${TYPE_COLORS[org.type] || 'bg-zinc-800'}`}>
                    {org.type}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  {org.phone ? (
                    <a href={`tel:${org.phone}`} className="text-blue-400 hover:underline text-xs">
                      {org.phone}
                    </a>
                  ) : <span className="text-zinc-600 text-xs">—</span>}
                </td>
                <td className="px-3 py-4">
                  {org.email ? (
                    <a href={`mailto:${org.email}`} className="text-blue-400 hover:underline text-xs truncate block max-w-[180px]">
                      {org.email}
                    </a>
                  ) : <span className="text-zinc-600 text-xs">—</span>}
                </td>
                <td className="px-3 py-4 text-xs text-zinc-400 max-w-[180px]">{org.address}</td>
                <td className="px-3 py-4 w-[140px]">
                  <div className="flex flex-wrap gap-1">
                    {org.services.map(svc => {
                      const serviceColor = 
                        svc === 'Adoption' ? 'bg-green-900/70 text-green-300' :
                        svc === 'Surrender' ? 'bg-blue-900/70 text-blue-300' :
                        svc === 'Spay/Neuter' || svc === 'Low-Cost Spay/Neuter' ? 'bg-purple-900/70 text-purple-300' :
                        svc === 'Foster' || svc === 'Foster Network' || svc === 'Foster Program' ? 'bg-amber-900/70 text-amber-300' :
                        svc === 'TNR' || svc === 'Feral Cat Program' ? 'bg-cyan-900/70 text-cyan-300' :
                        svc === 'Transport' ? 'bg-indigo-900/70 text-indigo-300' :
                        svc === 'Stray Intake' || svc === 'Lost & Found' ? 'bg-orange-900/70 text-orange-300' :
                        svc === 'Low-Cost Clinic' || svc === 'Spay/Neuter Vouchers' || svc === 'Vouchers' ? 'bg-pink-900/70 text-pink-300' :
                        svc === 'Education' || svc === 'Humane Education' ? 'bg-teal-900/70 text-teal-300' :
                        svc === 'Cruelty Investigation' || svc === 'Cruelty Response' ? 'bg-red-900/70 text-red-300' :
                        svc === 'No-Kill' ? 'bg-emerald-900/70 text-emerald-300' :
                        'bg-zinc-800 text-zinc-400';
                      return (
                        <span key={svc} className={`text-xs px-1.5 py-0.5 rounded ${serviceColor}`}>
                          {svc}
                        </span>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Type Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1">
            <span className={`inline-block w-3 h-3 rounded ${color.split(' ')[0]}`}></span>
            {type}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'counties' | 'shelters' | 'deadzones' | 'laws' | 'reform'>('overview');
  const [searchCounty, setSearchCounty] = useState('');
  const [filterScore, setFilterScore] = useState<string | null>(null);

  const filteredCounties = COUNTY_DATA.filter(c => {
    if (searchCounty && !c.county.toLowerCase().includes(searchCounty.toLowerCase())) return false;
    if (filterScore && c.pet911Score !== filterScore) return false;
    return true;
  });

  const scoreStats = {
    excellent: COUNTY_DATA.filter(c => c.pet911Score === 'A+' || c.pet911Score === 'A').length,
    good: COUNTY_DATA.filter(c => c.pet911Score === 'B').length,
    fair: COUNTY_DATA.filter(c => c.pet911Score === 'C').length,
    poor: COUNTY_DATA.filter(c => c.pet911Score === 'D').length,
    failing: COUNTY_DATA.filter(c => c.pet911Score === 'F').length,
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/admin/sysop" className="text-amber-500 text-sm hover:underline">← Back to Command Center</Link>
          <h1 className="text-2xl font-bold mt-2">📋 Compliance & Resources</h1>
          <p className="text-zinc-400 text-sm">WV Animal Control Laws, Shelter Directory & Pet911 Standards</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 flex gap-1">
          {[
            { id: 'overview', label: '📊 Overview', icon: '' },
            { id: 'counties', label: '🗺️ County Directory', icon: '' },
            { id: 'shelters', label: '🏠 Shelters & Rescues', icon: '' },
            { id: 'deadzones', label: '🚨 Dead Zones', icon: '' },
            { id: 'laws', label: '⚖️ State Law', icon: '' },
            { id: 'reform', label: '🎯 Reform Agenda', icon: '' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Score Summary */}
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-400">{scoreStats.excellent}</div>
                <div className="text-xs text-green-300">A/A+ Counties</div>
              </div>
              <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">{scoreStats.good}</div>
                <div className="text-xs text-blue-300">B Counties</div>
              </div>
              <div className="bg-yellow-900/30 border border-yellow-800 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-yellow-400">{scoreStats.fair}</div>
                <div className="text-xs text-yellow-300">C Counties</div>
              </div>
              <div className="bg-orange-900/30 border border-orange-800 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-orange-400">{scoreStats.poor}</div>
                <div className="text-xs text-orange-300">D Counties</div>
              </div>
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-400">{scoreStats.failing}</div>
                <div className="text-xs text-red-300">F Counties</div>
              </div>
            </div>

            {/* Pet911 Compliance Pillars */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Pet911 Compliance Pillars</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {COMPLIANCE_PILLARS.map(pillar => (
                  <div key={pillar.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                    <div className="text-2xl mb-2">{pillar.icon}</div>
                    <div className="font-medium text-sm">{pillar.name}</div>
                    <div className="text-xs text-zinc-500 mt-1">{pillar.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Findings */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Key Findings</h2>
              <div className="space-y-3">
                <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4">
                  <div className="font-medium text-red-300">🚨 The 3-Day Harboring Trap</div>
                  <div className="text-sm text-zinc-400 mt-1">
                    Counties like Monongalia and Berkeley define anyone who feeds a stray for 3 days as the "owner." 
                    This punishes Good Samaritans and discourages community involvement in pet recovery.
                  </div>
                </div>
                <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-4">
                  <div className="font-medium text-green-300">✅ Gold Standard: Mercer County</div>
                  <div className="text-sm text-zinc-400 mt-1">
                    15-day finder immunity period allows citizens to actively search for owners without legal liability. 
                    Combined with mandatory spay/neuter, Mercer leads in Pet911 compliance.
                  </div>
                </div>
                <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-4">
                  <div className="font-medium text-amber-300">⚠️ Digital Notice Gap</div>
                  <div className="text-sm text-zinc-400 mt-1">
                    State law requires posting in the "county courthouse" - a 1951 requirement that ignores 
                    digital platforms. Many rural shelters technically comply while failing to provide meaningful notice.
                  </div>
                </div>
                <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
                  <div className="font-medium text-blue-300">📡 Harrison County Model</div>
                  <div className="text-sm text-zinc-400 mt-1">
                    Mandatory microchipping for all reclaimed animals. If every reclaimed pet left with a chip, 
                    "unknown owner" strays would plummet over time.
                  </div>
                </div>
              </div>
            </div>

            {/* State Code Summary */}
            <div>
              <h2 className="text-lg font-semibold mb-4">WV Code Chapter 19-20 Summary</h2>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-zinc-800">
                    <tr>
                      <td className="px-4 py-3 font-medium text-zinc-300">Minimum Hold Period</td>
                      <td className="px-4 py-3">5 days after notice (§ 19-20-8)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-zinc-300">Notice Requirement</td>
                      <td className="px-4 py-3">Post in county courthouse (outdated)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-zinc-300">Rabies Quarantine</td>
                      <td className="px-4 py-3">10 days observation; 6 months for unvaccinated exposed</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-zinc-300">Hunting Dog Exemption</td>
                      <td className="px-4 py-3">Vaccinated dogs may run at large during lawful hunting</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-zinc-300">Mandatory Scanning</td>
                      <td className="px-4 py-3 text-red-400">NOT REQUIRED by state law</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'counties' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4 items-center">
              <input
                type="text"
                placeholder="🔍 Search county..."
                value={searchCounty}
                onChange={(e) => setSearchCounty(e.target.value)}
                className="flex-1 max-w-xs bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm"
              />
              <select
                value={filterScore || ''}
                onChange={(e) => setFilterScore(e.target.value || null)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Scores</option>
                <option value="A+">A+ Only</option>
                <option value="A">A Only</option>
                <option value="B">B Only</option>
                <option value="C">C Only</option>
                <option value="D">D Only</option>
                <option value="F">F Only</option>
              </select>
              <span className="text-sm text-zinc-500">{filteredCounties.length} of 55 counties</span>
            </div>

            {/* County Table */}
            <div className="border border-zinc-800 rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[1200px]">
                <thead className="bg-zinc-900/80">
                  <tr className="text-left text-xs text-zinc-400 uppercase">
                    <th className="px-3 py-3">County</th>
                    <th className="px-3 py-3">Facility</th>
                    <th className="px-3 py-3">📞 Phone</th>
                    <th className="px-3 py-3">✉️ Email</th>
                    <th className="px-3 py-3">📍 Address</th>
                    <th className="px-3 py-3">Hold</th>
                    <th className="px-3 py-3 text-center">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredCounties.map(county => (
                    <tr key={county.county} className="hover:bg-zinc-900/50">
                      <td className="px-3 py-3">
                        <div className="font-medium">{county.county}</div>
                        <div className="text-xs text-zinc-500">{county.agency}</div>
                      </td>
                      <td className="px-3 py-3 text-zinc-300 text-xs">{county.facility}</td>
                      <td className="px-3 py-3">
                        {county.phone ? (
                          <a href={`tel:${county.phone}`} className="text-blue-400 hover:underline text-xs">
                            {county.phone}
                          </a>
                        ) : <span className="text-zinc-600 text-xs">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        {county.email ? (
                          <a href={`mailto:${county.email}`} className="text-blue-400 hover:underline text-xs truncate block max-w-[180px]">
                            {county.email}
                          </a>
                        ) : <span className="text-zinc-600 text-xs">—</span>}
                      </td>
                      <td className="px-3 py-3 text-xs text-zinc-400 max-w-[200px]">{county.address}</td>
                      <td className="px-3 py-3">
                        <span className={`text-xs px-2 py-1 rounded ${
                          county.harboring === '15-day' ? 'bg-green-900 text-green-300' :
                          county.harboring === '3-day' ? 'bg-red-900 text-red-300' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {county.harboring}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${SCORE_COLORS[county.pet911Score]}`}>
                          {county.pet911Score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
              <span><span className="inline-block w-3 h-3 bg-green-900 rounded mr-1"></span> 15-day finder immunity</span>
              <span><span className="inline-block w-3 h-3 bg-red-900 rounded mr-1"></span> 3-day harboring trap</span>
              <span><span className="inline-block w-3 h-3 bg-zinc-800 rounded mr-1"></span> Standard 5-day hold</span>
            </div>
          </div>
        )}

        {activeTab === 'shelters' && (
          <SheltersTab />
        )}

        {activeTab === 'deadzones' && (
          <div className="space-y-6">
            {/* Header Warning */}
            <div className="bg-red-900/30 border border-red-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-red-400 flex items-center gap-2">
                🚨 Animal Welfare Dead Zones in West Virginia
              </h2>
              <p className="text-zinc-300 mt-2">
                These counties have severely limited or no animal welfare infrastructure. Animals in these areas face 
                significantly higher risks of abandonment, neglect, and euthanasia due to lack of resources.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-400">3</div>
                <div className="text-xs text-zinc-400">No Dedicated Shelter</div>
              </div>
              <div className="bg-orange-900/20 border border-orange-800/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-orange-400">22</div>
                <div className="text-xs text-zinc-400">D-Rated Counties</div>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-yellow-400">~600K</div>
                <div className="text-xs text-zinc-400">People Underserved</div>
              </div>
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-zinc-300">45%</div>
                <div className="text-xs text-zinc-400">of WV Counties</div>
              </div>
            </div>

            {/* Critical Dead Zones - No Shelter */}
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-3">🔴 Critical: No Dedicated Shelter Facility</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { county: 'Calhoun', pop: '7,000', issue: 'Must transport to neighboring counties', nearest: 'Roane or Wood County (~45 min)', contact: '(304) 354-6118' },
                  { county: 'Gilmer', pop: '8,000', issue: 'Sheriff handles strays informally', nearest: 'Lewis County (~30 min)', contact: '(304) 462-7454' },
                  { county: 'Wirt', pop: '5,800', issue: 'No intake capability, relies on Sheriff', nearest: 'Wood County (~40 min)', contact: '(304) 275-4200' },
                ].map(zone => (
                  <div key={zone.county} className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                    <div className="font-bold text-red-300 text-lg">{zone.county} County</div>
                    <div className="text-xs text-zinc-500 mb-2">Population: {zone.pop}</div>
                    <div className="text-sm text-zinc-400 mb-2">{zone.issue}</div>
                    <div className="text-xs text-zinc-500">
                      <span className="text-zinc-400">Nearest facility:</span> {zone.nearest}
                    </div>
                    <div className="text-xs text-blue-400 mt-2">
                      <a href={`tel:${zone.contact}`}>{zone.contact}</a> (Sheriff)
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Severely Underserved */}
            <div>
              <h3 className="text-lg font-semibold text-orange-400 mb-3">🟠 Severely Underserved: D-Rated Counties</h3>
              <p className="text-sm text-zinc-500 mb-3">These counties have basic facilities but rely heavily on state code minimums with limited services.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {COUNTY_DATA.filter(c => c.pet911Score === 'D').map(county => (
                  <div key={county.county} className="bg-orange-900/20 border border-orange-800/50 rounded-lg px-3 py-2 text-center">
                    <div className="font-medium text-orange-300 text-sm">{county.county}</div>
                    <div className="text-xs text-zinc-500">{county.agency}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3-Day Harboring Trap Counties */}
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">🟡 Legal Trap Zones: 3-Day Harboring Rule</h3>
              <p className="text-sm text-zinc-500 mb-3">
                These counties penalize Good Samaritans who help strays. After 3 days of feeding/sheltering, finders become 
                legally liable as "owners" - discouraging community involvement in pet recovery.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {COUNTY_DATA.filter(c => c.harboring === '3-day').map(county => (
                  <div key={county.county} className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-3">
                    <div className="font-medium text-yellow-300">{county.county}</div>
                    <div className="text-xs text-zinc-400">{county.facility}</div>
                    <div className="text-xs text-red-400 mt-1">⚠️ 3-day ownership rule</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Geographic Clusters */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-300 mb-3">📍 Geographic Dead Zone Clusters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <h4 className="font-medium text-zinc-200 mb-2">Central Mountain Region</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    Webster, Nicholas, Clay, Braxton, Calhoun, Gilmer - sparse population, limited roads, 
                    minimal shelter infrastructure. Animals often travel 1+ hour to reach services.
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {['Webster', 'Nicholas', 'Clay', 'Braxton', 'Calhoun', 'Gilmer'].map(c => (
                      <span key={c} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{c}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <h4 className="font-medium text-zinc-200 mb-2">Southern Coalfields</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    McDowell, Wyoming, Mingo, Logan - economic challenges limit shelter funding. 
                    High stray populations, limited rescue network reach.
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {['McDowell', 'Wyoming', 'Mingo', 'Logan'].map(c => (
                      <span key={c} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{c}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <h4 className="font-medium text-zinc-200 mb-2">Eastern Highland Corridor</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    Pendleton, Highland border, Pocahontas, Randolph - vast rural areas with 
                    minimal population density. Sheriff-based enforcement only.
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {['Pendleton', 'Pocahontas', 'Randolph', 'Tucker'].map(c => (
                      <span key={c} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{c}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <h4 className="font-medium text-zinc-200 mb-2">Mid-Ohio Valley Rural</h4>
                  <p className="text-sm text-zinc-400 mb-2">
                    Wirt, Pleasants, Tyler, Ritchie - small populations surrounded by better-resourced 
                    Wood and Ohio counties but lack local services.
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {['Wirt', 'Pleasants', 'Tyler', 'Ritchie'].map(c => (
                      <span key={c} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* What Pet911 Can Do */}
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-3">✅ How Pet911 Addresses Dead Zones</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-green-300 mb-1">Digital Coverage</h4>
                  <p className="text-zinc-400">
                    Lost/found reports work regardless of local shelter infrastructure - animals can be 
                    matched across county lines instantly.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-green-300 mb-1">Volunteer Network</h4>
                  <p className="text-zinc-400">
                    Transport volunteers can bridge gaps between dead zones and resourced shelters.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-green-300 mb-1">Foster Coordination</h4>
                  <p className="text-zinc-400">
                    Emergency foster network provides safe harbor when no shelter is available locally.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-green-300 mb-1">Regional Routing</h4>
                  <p className="text-zinc-400">
                    Automatic escalation to nearest A/B-rated facility when local resources unavailable.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'laws' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white">⚖️ WV Code Chapter 19, Article 20 - Dogs</h2>
              <p className="text-zinc-400 mt-2">West Virginia&apos;s animal control statutes governing impoundment, wardens, and enforcement</p>
            </div>

            {/* Law Sections Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* § 19-20-6 */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-blue-900/50 text-blue-300 px-2 py-1 rounded text-xs font-mono">§ 19-20-6</div>
                  <h3 className="font-semibold text-zinc-100">County Dog Warden</h3>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  The County Commission of each county shall appoint a dog warden and necessary deputies to enforce 
                  the provisions of the code. The Commission may employ a warden directly or appoint an officer of a 
                  humane society to serve in this capacity.
                </p>
              </div>

              {/* § 19-20-8 */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-green-900/50 text-green-300 px-2 py-1 rounded text-xs font-mono">§ 19-20-8</div>
                  <h3 className="font-semibold text-zinc-100">Impoundment and Hold Period</h3>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  All impounded dogs must be housed and fed for a period of <span className="text-green-400 font-semibold">five days</span> after notice 
                  of seizure has been given or posted. This is the absolute minimum standard - no county may reduce 
                  this period, though they may extend it.
                </p>
              </div>

              {/* Notice Requirements */}
              <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-amber-900/50 text-amber-300 px-2 py-1 rounded text-xs font-mono">⚠️ GAP</div>
                  <h3 className="font-semibold text-amber-200">Notice Requirements (Critical Gap)</h3>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  For unknown owners, the warden must &quot;post a notice in the county courthouse&quot; describing the dog 
                  and place of seizure. This requirement is a <span className="text-amber-400">relic of 1951</span> - it does not mandate digital 
                  notification, creating a compliance gap where rural counties may technically follow the law 
                  while failing to provide meaningful notice.
                </p>
              </div>

              {/* § 19-20A-8 */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-purple-900/50 text-purple-300 px-2 py-1 rounded text-xs font-mono">§ 19-20A-8</div>
                  <h3 className="font-semibold text-zinc-100">Rabies Control & Running at Large</h3>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Vaccinated dogs and cats may run at large unless in a quarantined area. The statute explicitly 
                  prohibits counties from preventing vaccinated dogs from running at large while engaged in lawful 
                  hunting, training, or herding activities. This <span className="text-purple-400">&quot;hunting dog exemption&quot;</span> complicates enforcement.
                </p>
              </div>

              {/* § 7-10-1 */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 lg:col-span-2">
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-cyan-900/50 text-cyan-300 px-2 py-1 rounded text-xs font-mono">§ 7-10-1</div>
                  <h3 className="font-semibold text-zinc-100">Humane Officer Powers</h3>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Humane officers are designated to investigate cruelty complaints and have authority to take 
                  possession of abandoned or neglected animals. Veterinarians and professionals have <span className="text-cyan-400">mandatory 
                  reporter status</span> with immunity for good-faith reports.
                </p>
              </div>
            </div>

            {/* Quick Reference Table */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
                <h3 className="font-semibold">📋 Quick Reference</h3>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-zinc-800">
                  <tr className="hover:bg-zinc-800/30">
                    <td className="px-4 py-3 font-medium text-zinc-300 w-1/3">Minimum Hold Period</td>
                    <td className="px-4 py-3 text-green-400">5 days after notice (§ 19-20-8)</td>
                  </tr>
                  <tr className="hover:bg-zinc-800/30">
                    <td className="px-4 py-3 font-medium text-zinc-300">Notice Requirement</td>
                    <td className="px-4 py-3 text-amber-400">Post in county courthouse (outdated - 1951)</td>
                  </tr>
                  <tr className="hover:bg-zinc-800/30">
                    <td className="px-4 py-3 font-medium text-zinc-300">Rabies Quarantine</td>
                    <td className="px-4 py-3 text-zinc-300">10 days observation; 6 months for unvaccinated exposed</td>
                  </tr>
                  <tr className="hover:bg-zinc-800/30">
                    <td className="px-4 py-3 font-medium text-zinc-300">Hunting Dog Exemption</td>
                    <td className="px-4 py-3 text-purple-400">Vaccinated dogs may run at large during lawful hunting</td>
                  </tr>
                  <tr className="hover:bg-zinc-800/30">
                    <td className="px-4 py-3 font-medium text-zinc-300">Mandatory Microchip Scanning</td>
                    <td className="px-4 py-3 text-red-400">❌ NOT REQUIRED by state law</td>
                  </tr>
                  <tr className="hover:bg-zinc-800/30">
                    <td className="px-4 py-3 font-medium text-zinc-300">Digital Photo Posting</td>
                    <td className="px-4 py-3 text-red-400">❌ NOT REQUIRED by state law</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Reform Link */}
            <div className="bg-gradient-to-r from-amber-900/20 to-green-900/20 border border-amber-800/50 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-amber-300">🐕 Want to fix these gaps?</p>
                <p className="text-sm text-zinc-400">The B.A.R.K. Act addresses all critical compliance gaps in WV animal law.</p>
              </div>
              <button 
                onClick={() => setActiveTab('reform')}
                className="bg-amber-600 hover:bg-amber-700 text-black font-medium px-4 py-2 rounded-lg text-sm"
              >
                View Reform Agenda →
              </button>
            </div>
          </div>
        )}

        {activeTab === 'reform' && (
          <div className="space-y-6">
            {/* B.A.R.K. Act Hero */}
            <div className="bg-gradient-to-r from-amber-900/30 to-green-900/30 border border-amber-700 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-amber-400 font-medium uppercase tracking-wide">Proposed Legislation</div>
                  <h2 className="text-2xl font-bold text-white mt-1">🐕 The B.A.R.K. Act</h2>
                  <p className="text-zinc-300 mt-1">Breeder Accountability and Regulation for Kindness Act</p>
                  <p className="text-sm text-zinc-400 mt-2">WV Code Chapter 19, Article 36 • 55 Sections • Effective July 1, 2026</p>
                </div>
                <div className="bg-amber-600 text-black text-xs font-bold px-3 py-1 rounded">HOUSE BILL</div>
              </div>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-amber-400">20</div>
                <div className="text-xs text-zinc-500">Max Breeding Dogs</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">14</div>
                <div className="text-xs text-zinc-500">Day Finder Immunity</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">24hr</div>
                <div className="text-xs text-zinc-500">Digital Notice Req</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">10hr</div>
                <div className="text-xs text-zinc-500">Max Tether Time</div>
              </div>
            </div>

            {/* Core Pillars */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-3">📜 Six Core Pillars</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
                  <div className="text-blue-400 font-medium mb-2">🏷️ Universal Breeder Licensing</div>
                  <ul className="text-xs text-zinc-400 space-y-1">
                    <li>• Tier 1: 1-3 dogs ($100/yr)</li>
                    <li>• Tier 2: 4-10 dogs ($300+$10/dog)</li>
                    <li>• Tier 3: 11-20 dogs ($1000+$25/dog)</li>
                    <li>• No hobby breeder exemptions</li>
                    <li>• One-time accidental litter registration ($25)</li>
                  </ul>
                </div>
                <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-4">
                  <div className="text-green-400 font-medium mb-2">🐶 Animal Welfare Standards</div>
                  <ul className="text-xs text-zinc-400 space-y-1">
                    <li>• Dogs classified as "companion animals"</li>
                    <li>• Min 12-24 sq ft per dog (by size)</li>
                    <li>• 50-85°F temperature range</li>
                    <li>• 30 min daily exercise minimum</li>
                    <li>• Max 5 litters per lifetime</li>
                  </ul>
                </div>
                <div className="bg-purple-900/20 border border-purple-800/50 rounded-lg p-4">
                  <div className="text-purple-400 font-medium mb-2">🔍 Mandatory Inspections</div>
                  <ul className="text-xs text-zinc-400 space-y-1">
                    <li>• Tier 1: 1x/year unannounced</li>
                    <li>• Tier 2: 2x/year unannounced</li>
                    <li>• Tier 3: 4x/year unannounced</li>
                    <li>• Letter grades (A/B/C/D) posted publicly</li>
                    <li>• Behavioral assessments (Green/Yellow/Red)</li>
                  </ul>
                </div>
                <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-4">
                  <div className="text-amber-400 font-medium mb-2">🏠 Finder Immunity</div>
                  <ul className="text-xs text-zinc-400 space-y-1">
                    <li>• 14-day safe harbor for Good Samaritans</li>
                    <li>• No surrender fees for qualifying finders</li>
                    <li>• Harboring = 14+ consecutive days</li>
                    <li>• Preempts shorter county ordinances</li>
                    <li>• Liability protection during safe harbor</li>
                  </ul>
                </div>
                <div className="bg-cyan-900/20 border border-cyan-800/50 rounded-lg p-4">
                  <div className="text-cyan-400 font-medium mb-2">📡 Digital Transparency</div>
                  <ul className="text-xs text-zinc-400 space-y-1">
                    <li>• Mandatory intake scanning for microchips</li>
                    <li>• 24hr digital posting requirement</li>
                    <li>• Statewide impound database</li>
                    <li>• 10-day hold if chip found</li>
                    <li>• Public breeder registry with API</li>
                  </ul>
                </div>
                <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4">
                  <div className="text-red-400 font-medium mb-2">⛓️ Tethering Restrictions</div>
                  <ul className="text-xs text-zinc-400 space-y-1">
                    <li>• Max 10 hours in 24-hour period</li>
                    <li>• Prohibited {">"} 90°F or {"<"} 32°F</li>
                    <li>• Min 10ft tether length</li>
                    <li>• No choke/prong collar attachment</li>
                    <li>• Prohibited for puppies {"<"} 6 months</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Consumer Protections */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-zinc-200 mb-3">🛡️ Consumer Protections</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="text-zinc-300 font-medium">Transfer Requirements</h4>
                  <ul className="text-xs text-zinc-400 mt-2 space-y-1">
                    <li>• Microchip required before transfer</li>
                    <li>• Min 8 weeks age for puppy transfer</li>
                    <li>• Health disclosure 24hr before purchase</li>
                    <li>• Behavioral disclosure at transfer</li>
                    <li>• License # required in all ads</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-zinc-300 font-medium">Buyer Remedies</h4>
                  <ul className="text-xs text-zinc-400 mt-2 space-y-1">
                    <li>• Private right of action for violations</li>
                    <li>• Predatory financing prohibited</li>
                    <li>• Parking lot sales = serious violation</li>
                    <li>• Marketplace platforms must verify licenses</li>
                    <li>• 3-year statute of limitations</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Regional Authorities */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-zinc-200 mb-3">🤝 Regional Animal Control Authorities</h3>
              <p className="text-sm text-zinc-400 mb-3">
                The B.A.R.K. Act authorizes counties to form joint authorities for consolidated sheltering and enforcement—a direct solution for Dead Zone counties.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-zinc-800/50 rounded p-3">
                  <div className="text-zinc-300 font-medium mb-1">Joint Authority Powers</div>
                  <ul className="text-zinc-500 space-y-0.5">
                    <li>• Operate shared shelter facilities</li>
                    <li>• Employ officers with multi-county jurisdiction</li>
                    <li>• Pool tax revenues and fees</li>
                    <li>• Apply jointly for state grants (priority)</li>
                  </ul>
                </div>
                <div className="bg-zinc-800/50 rounded p-3">
                  <div className="text-zinc-300 font-medium mb-1">State Support</div>
                  <ul className="text-zinc-500 space-y-0.5">
                    <li>• Technical assistance from Dept of Ag</li>
                    <li>• Priority grant funding for formation</li>
                    <li>• Model agreement templates provided</li>
                    <li>• Training programs for joint personnel</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Enforcement Fund */}
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-green-300 mb-3">💰 Canine Welfare Enforcement Fund</h3>
              <p className="text-sm text-zinc-400 mb-3">Self-funding mechanism—no taxpayer burden.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-zinc-900/50 rounded p-2 text-center">
                  <div className="text-green-400 font-medium">Revenue</div>
                  <div className="text-zinc-500">License fees, penalties, $10/puppy transfer</div>
                </div>
                <div className="bg-zinc-900/50 rounded p-2 text-center">
                  <div className="text-green-400 font-medium">15%</div>
                  <div className="text-zinc-500">County spay/neuter grants</div>
                </div>
                <div className="bg-zinc-900/50 rounded p-2 text-center">
                  <div className="text-green-400 font-medium">10%</div>
                  <div className="text-zinc-500">Rural shelter development</div>
                </div>
                <div className="bg-zinc-900/50 rounded p-2 text-center">
                  <div className="text-green-400 font-medium">Free</div>
                  <div className="text-zinc-500">Scanners to all counties</div>
                </div>
              </div>
            </div>

            {/* Pet911 Alignment */}
            <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-5">
              <h3 className="font-semibold text-amber-300">🚨 Pet911 Alignment</h3>
              <p className="text-sm text-zinc-300 mt-2">
                The B.A.R.K. Act's digital transparency requirements mirror Pet911's existing infrastructure:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-xs">
                <div className="bg-zinc-900/50 rounded p-3">
                  <div className="text-amber-400 font-medium">§19-36-48</div>
                  <div className="text-zinc-400">24hr digital posting → Pet911 already does this</div>
                </div>
                <div className="bg-zinc-900/50 rounded p-3">
                  <div className="text-amber-400 font-medium">§19-36-48</div>
                  <div className="text-zinc-400">Statewide database → Pet911 provides this</div>
                </div>
                <div className="bg-zinc-900/50 rounded p-3">
                  <div className="text-amber-400 font-medium">§19-36-49</div>
                  <div className="text-zinc-400">Finder safe harbor → Pet911 empowers finders</div>
                </div>
              </div>
              <p className="text-sm text-zinc-400 mt-4">
                Shelters using Pet911 will automatically meet B.A.R.K. Act digital compliance requirements.
              </p>
            </div>

            {/* Timeline */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-zinc-200 mb-3">📅 Implementation Timeline</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-24 text-zinc-500 text-xs">July 1, 2026</div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="text-zinc-300">Effective date</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 text-zinc-500 text-xs">+180 days</div>
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <div className="text-zinc-300">Existing breeders must obtain license</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 text-zinc-500 text-xs">+180 days</div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="text-zinc-300">Model templates published</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 text-zinc-500 text-xs">+2 years</div>
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <div className="text-zinc-300">Over-limit operations must comply via attrition</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 text-zinc-500 text-xs">+2 years</div>
                  <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                  <div className="text-zinc-300">Public API for registry verification</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 text-zinc-500 text-xs">+3 years</div>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="text-zinc-300">Behavioral assessments become enforceable</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 text-zinc-500 text-xs">+5 years</div>
                  <div className="w-3 h-3 bg-zinc-500 rounded-full"></div>
                  <div className="text-zinc-300">Mandatory legislative review</div>
                </div>
              </div>
            </div>

            {/* Full Text Link */}
            <div className="text-center py-4">
              <p className="text-xs text-zinc-500">
                Full text available: <span className="text-amber-400">BARK_Act_v13_FINAL_WV.docx</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
