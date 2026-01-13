'use client';

import { useState } from 'react';
import Link from 'next/link';

const WV_LEGISLATORS = [
  // Senate Districts (17 districts)
  { district: '1', chamber: 'Senate', name: 'Charles Clements', party: 'R', email: 'charles.clements@wvsenate.gov', phone: '(304) 357-7880', counties: ['Hancock', 'Brooke', 'Ohio'] },
  { district: '2', chamber: 'Senate', name: 'Ryan Weld', party: 'R', email: 'ryan.weld@wvsenate.gov', phone: '(304) 357-7901', counties: ['Marshall', 'Wetzel', 'Tyler'] },
  { district: '3', chamber: 'Senate', name: 'Charles Trump', party: 'R', email: 'charles.trump@wvsenate.gov', phone: '(304) 357-7880', counties: ['Morgan', 'Berkeley', 'Jefferson'] },
  { district: '4', chamber: 'Senate', name: 'Dave Stover', party: 'R', email: 'dave.stover@wvsenate.gov', phone: '(304) 357-7973', counties: ['Wyoming', 'McDowell', 'Mercer'] },
  { district: '5', chamber: 'Senate', name: 'Vince Deeds', party: 'R', email: 'vince.deeds@wvsenate.gov', phone: '(304) 357-7959', counties: ['Greenbrier', 'Monroe', 'Summers', 'Pocahontas'] },
  { district: '6', chamber: 'Senate', name: 'Chandler Swope', party: 'R', email: 'chandler.swope@wvsenate.gov', phone: '(304) 357-7957', counties: ['Mercer', 'Raleigh'] },
  { district: '7', chamber: 'Senate', name: 'Rupie Phillips', party: 'R', email: 'rupie.phillips@wvsenate.gov', phone: '(304) 357-7857', counties: ['Logan', 'Mingo', 'Wayne'] },
  { district: '8', chamber: 'Senate', name: 'Glenn Jeffries', party: 'D', email: 'glenn.jeffries@wvsenate.gov', phone: '(304) 357-7961', counties: ['Putnam', 'Kanawha'] },
  { district: '9', chamber: 'Senate', name: 'Rollan Roberts', party: 'R', email: 'rollan.roberts@wvsenate.gov', phone: '(304) 357-7995', counties: ['Raleigh', 'Fayette'] },
  { district: '10', chamber: 'Senate', name: 'Tom Takubo', party: 'R', email: 'tom.takubo@wvsenate.gov', phone: '(304) 357-7990', counties: ['Kanawha'] },
  { district: '11', chamber: 'Senate', name: 'Mike Maroney', party: 'R', email: 'mike.maroney@wvsenate.gov', phone: '(304) 357-7902', counties: ['Pleasants', 'Ritchie', 'Doddridge', 'Harrison'] },
  { district: '12', chamber: 'Senate', name: 'Michael Azinger', party: 'R', email: 'michael.azinger@wvsenate.gov', phone: '(304) 357-7851', counties: ['Wood', 'Wirt', 'Calhoun', 'Roane'] },
  { district: '13', chamber: 'Senate', name: 'Patrick Martin', party: 'R', email: 'patrick.martin@wvsenate.gov', phone: '(304) 357-7997', counties: ['Lewis', 'Upshur', 'Barbour', 'Randolph'] },
  { district: '14', chamber: 'Senate', name: 'Randy Smith', party: 'R', email: 'randy.smith@wvsenate.gov', phone: '(304) 357-7995', counties: ['Tucker', 'Preston', 'Grant', 'Mineral', 'Hardy', 'Pendleton'] },
  { district: '15', chamber: 'Senate', name: 'Mark Maynard', party: 'R', email: 'mark.maynard@wvsenate.gov', phone: '(304) 357-7808', counties: ['Cabell', 'Wayne'] },
  { district: '16', chamber: 'Senate', name: 'Eric Tarr', party: 'R', email: 'eric.tarr@wvsenate.gov', phone: '(304) 357-7901', counties: ['Boone', 'Kanawha', 'Lincoln'] },
  { district: '17', chamber: 'Senate', name: 'Patricia Rucker', party: 'R', email: 'patricia.rucker@wvsenate.gov', phone: '(304) 357-7957', counties: ['Jefferson', 'Berkeley'] },
  // House Delegates (100 districts - full list)
  { district: '1', chamber: 'House', name: 'Pat McGeehan', party: 'R', email: 'pat.mcgeehan@wvhouse.gov', phone: '(304) 340-3142', counties: ['Hancock'] },
  { district: '2', chamber: 'House', name: 'Shawn Fluharty', party: 'D', email: 'shawn.fluharty@wvhouse.gov', phone: '(304) 340-3270', counties: ['Ohio'] },
  { district: '3', chamber: 'House', name: 'Lisa Zukoff', party: 'D', email: 'lisa.zukoff@wvhouse.gov', phone: '(304) 340-3280', counties: ['Ohio'] },
  { district: '4', chamber: 'House', name: 'Dave Pethtel', party: 'D', email: 'dave.pethtel@wvhouse.gov', phone: '(304) 340-3158', counties: ['Wetzel'] },
  { district: '5', chamber: 'House', name: 'Trenton Barnhart', party: 'R', email: 'trenton.barnhart@wvhouse.gov', phone: '(304) 340-3170', counties: ['Pleasants', 'Tyler'] },
  { district: '6', chamber: 'House', name: 'David Wilson', party: 'R', email: 'david.wilson@wvhouse.gov', phone: '(304) 340-3170', counties: ['Marshall'] },
  { district: '7', chamber: 'House', name: 'John Kelly', party: 'R', email: 'john.kelly@wvhouse.gov', phone: '(304) 340-3170', counties: ['Wood'] },
  { district: '8', chamber: 'House', name: 'Vernon Criss', party: 'R', email: 'vernon.criss@wvhouse.gov', phone: '(304) 340-3170', counties: ['Wood'] },
  { district: '9', chamber: 'House', name: 'Steve Westfall', party: 'R', email: 'steve.westfall@wvhouse.gov', phone: '(304) 340-3170', counties: ['Wood', 'Jackson'] },
  { district: '10', chamber: 'House', name: 'Josh Holstein', party: 'R', email: 'josh.holstein@wvhouse.gov', phone: '(304) 340-3170', counties: ['Boone', 'Lincoln'] },
  { district: '11', chamber: 'House', name: 'Kathie Hess Crouse', party: 'R', email: 'kathie.crouse@wvhouse.gov', phone: '(304) 340-3170', counties: ['Putnam'] },
  { district: '12', chamber: 'House', name: 'Jordan Bridges', party: 'R', email: 'jordan.bridges@wvhouse.gov', phone: '(304) 340-3170', counties: ['Putnam'] },
  { district: '13', chamber: 'House', name: 'Scot Heckert', party: 'R', email: 'scot.heckert@wvhouse.gov', phone: '(304) 340-3170', counties: ['Mason'] },
  { district: '14', chamber: 'House', name: 'Jonathan Pinson', party: 'R', email: 'jonathan.pinson@wvhouse.gov', phone: '(304) 340-3170', counties: ['Mason', 'Cabell'] },
  { district: '15', chamber: 'House', name: 'Sean Hornbuckle', party: 'D', email: 'sean.hornbuckle@wvhouse.gov', phone: '(304) 340-3395', counties: ['Cabell'] },
  { district: '16', chamber: 'House', name: 'David Kelly', party: 'R', email: 'david.kelly@wvhouse.gov', phone: '(304) 340-3226', counties: ['Cabell'] },
  { district: '17', chamber: 'House', name: 'Matt Rohrbach', party: 'R', email: 'matt.rohrbach@wvhouse.gov', phone: '(304) 340-3170', counties: ['Cabell'] },
  { district: '18', chamber: 'House', name: 'Chad Lovejoy', party: 'D', email: 'chad.lovejoy@wvhouse.gov', phone: '(304) 340-3170', counties: ['Cabell'] },
  { district: '19', chamber: 'House', name: 'Margitta Mazzocchi', party: 'R', email: 'margitta.mazzocchi@wvhouse.gov', phone: '(304) 340-3170', counties: ['Logan', 'Wayne'] },
  { district: '20', chamber: 'House', name: 'Adam Vance', party: 'R', email: 'adam.vance@wvhouse.gov', phone: '(304) 340-3170', counties: ['Wayne'] },
  { district: '21', chamber: 'House', name: 'Evan Worrell', party: 'R', email: 'evan.worrell@wvhouse.gov', phone: '(304) 340-3170', counties: ['Cabell', 'Wayne'] },
  { district: '22', chamber: 'House', name: 'Jeff Pack', party: 'R', email: 'jeff.pack@wvhouse.gov', phone: '(304) 340-3170', counties: ['Logan'] },
  { district: '23', chamber: 'House', name: 'Anitra Hamilton', party: 'D', email: 'anitra.hamilton@wvhouse.gov', phone: '(304) 340-3170', counties: ['Logan', 'Mingo'] },
  { district: '24', chamber: 'House', name: 'Elliott Pritt', party: 'R', email: 'elliott.pritt@wvhouse.gov', phone: '(304) 340-3170', counties: ['Boone', 'Logan'] },
  { district: '25', chamber: 'House', name: 'Ed Evans', party: 'D', email: 'ed.evans@wvhouse.gov', phone: '(304) 340-3170', counties: ['McDowell'] },
  { district: '26', chamber: 'House', name: 'Brandon Steele', party: 'R', email: 'brandon.steele@wvhouse.gov', phone: '(304) 340-3170', counties: ['Raleigh'] },
  { district: '27', chamber: 'House', name: 'Mick Bates', party: 'D', email: 'mick.bates@wvhouse.gov', phone: '(304) 340-3170', counties: ['Raleigh'] },
  { district: '28', chamber: 'House', name: 'Cody Thompson', party: 'D', email: 'cody.thompson@wvhouse.gov', phone: '(304) 340-3170', counties: ['Raleigh'] },
  { district: '29', chamber: 'House', name: 'Doug Smith', party: 'R', email: 'doug.smith@wvhouse.gov', phone: '(304) 340-3170', counties: ['Mercer'] },
  { district: '30', chamber: 'House', name: 'Lori Dittman', party: 'R', email: 'lori.dittman@wvhouse.gov', phone: '(304) 340-3170', counties: ['Mercer'] },
  { district: '31', chamber: 'House', name: 'Joe Ellington', party: 'R', email: 'joe.ellington@wvhouse.gov', phone: '(304) 340-3352', counties: ['Mercer'] },
  { district: '32', chamber: 'House', name: 'Marty Gearheart', party: 'R', email: 'marty.gearheart@wvhouse.gov', phone: '(304) 340-3170', counties: ['Mercer', 'Wyoming'] },
  { district: '33', chamber: 'House', name: 'Mark Dean', party: 'R', email: 'mark.dean@wvhouse.gov', phone: '(304) 340-3170', counties: ['Mingo', 'Wyoming'] },
  { district: '34', chamber: 'House', name: 'John Williams', party: 'R', email: 'john.williams@wvhouse.gov', phone: '(304) 340-3170', counties: ['Monongalia'] },
  { district: '35', chamber: 'House', name: 'Moore Capito', party: 'R', email: 'moore.capito@wvhouse.gov', phone: '(304) 340-3249', counties: ['Kanawha'] },
  { district: '36', chamber: 'House', name: 'Andrew Byrd', party: 'D', email: 'andrew.byrd@wvhouse.gov', phone: '(304) 340-3170', counties: ['Kanawha'] },
  { district: '37', chamber: 'House', name: 'Joey Garcia', party: 'D', email: 'joey.garcia@wvhouse.gov', phone: '(304) 340-3170', counties: ['Marion'] },
  { district: '38', chamber: 'House', name: 'Mike Pushkin', party: 'D', email: 'mike.pushkin@wvhouse.gov', phone: '(304) 340-3170', counties: ['Kanawha'] },
  { district: '39', chamber: 'House', name: 'Kayla Young', party: 'D', email: 'kayla.young@wvhouse.gov', phone: '(304) 340-3170', counties: ['Kanawha'] },
  { district: '40', chamber: 'House', name: 'Larry Rowe', party: 'D', email: 'larry.rowe@wvhouse.gov', phone: '(304) 340-3170', counties: ['Kanawha'] },
  { district: '41', chamber: 'House', name: 'Dana Ferrell', party: 'R', email: 'dana.ferrell@wvhouse.gov', phone: '(304) 340-3170', counties: ['Kanawha'] },
  { district: '42', chamber: 'House', name: 'Mark Zatezalo', party: 'R', email: 'mark.zatezalo@wvhouse.gov', phone: '(304) 340-3170', counties: ['Hancock', 'Brooke'] },
  { district: '43', chamber: 'House', name: 'Chris Pritt', party: 'R', email: 'chris.pritt@wvhouse.gov', phone: '(304) 340-3170', counties: ['Kanawha'] },
  { district: '44', chamber: 'House', name: 'Dianna Graves', party: 'R', email: 'dianna.graves@wvhouse.gov', phone: '(304) 340-3170', counties: ['Kanawha'] },
  { district: '45', chamber: 'House', name: 'Tom Bibby', party: 'R', email: 'tom.bibby@wvhouse.gov', phone: '(304) 340-3170', counties: ['Kanawha'] },
  { district: '46', chamber: 'House', name: 'Erica Janysse', party: 'R', email: 'erica.janysse@wvhouse.gov', phone: '(304) 340-3170', counties: ['Fayette'] },
  { district: '47', chamber: 'House', name: 'Jeff Campbell', party: 'R', email: 'jeff.campbell@wvhouse.gov', phone: '(304) 340-3170', counties: ['Greenbrier', 'Monroe'] },
  { district: '48', chamber: 'House', name: 'Barry Bruce', party: 'R', email: 'barry.bruce@wvhouse.gov', phone: '(304) 340-3170', counties: ['Greenbrier'] },
  { district: '49', chamber: 'House', name: 'Mike Honaker', party: 'R', email: 'mike.honaker@wvhouse.gov', phone: '(304) 340-3170', counties: ['Greenbrier', 'Pocahontas'] },
  { district: '50', chamber: 'House', name: 'Todd Longanacre', party: 'R', email: 'todd.longanacre@wvhouse.gov', phone: '(304) 340-3170', counties: ['Summers', 'Monroe', 'Fayette'] },
  { district: '51', chamber: 'House', name: 'Marty Gearhart', party: 'R', email: 'marty.gearhart@wvhouse.gov', phone: '(304) 340-3170', counties: ['Nicholas'] },
  { district: '52', chamber: 'House', name: 'Mike Foster', party: 'R', email: 'mike.foster@wvhouse.gov', phone: '(304) 340-3170', counties: ['Clay', 'Braxton', 'Nicholas'] },
  { district: '53', chamber: 'House', name: 'Brent Boggs', party: 'D', email: 'brent.boggs@wvhouse.gov', phone: '(304) 340-3170', counties: ['Braxton', 'Gilmer'] },
  { district: '54', chamber: 'House', name: 'Carl Martin', party: 'R', email: 'carl.martin@wvhouse.gov', phone: '(304) 340-3170', counties: ['Upshur'] },
  { district: '55', chamber: 'House', name: 'Ben Queen', party: 'R', email: 'ben.queen@wvhouse.gov', phone: '(304) 340-3170', counties: ['Harrison'] },
  { district: '56', chamber: 'House', name: 'Laura Kimble', party: 'R', email: 'laura.kimble@wvhouse.gov', phone: '(304) 340-3170', counties: ['Harrison'] },
  { district: '57', chamber: 'House', name: 'Danny Hamrick', party: 'R', email: 'danny.hamrick@wvhouse.gov', phone: '(304) 340-3170', counties: ['Harrison'] },
  { district: '58', chamber: 'House', name: 'Amy Summers', party: 'R', email: 'amy.summers@wvhouse.gov', phone: '(304) 340-3192', counties: ['Taylor', 'Barbour'] },
  { district: '59', chamber: 'House', name: 'Gary Howell', party: 'R', email: 'gary.howell@wvhouse.gov', phone: '(304) 340-3170', counties: ['Mineral'] },
  { district: '60', chamber: 'House', name: 'Bryan Ward', party: 'R', email: 'bryan.ward@wvhouse.gov', phone: '(304) 340-3170', counties: ['Hardy', 'Grant'] },
  { district: '61', chamber: 'House', name: 'Riley Keaton', party: 'R', email: 'riley.keaton@wvhouse.gov', phone: '(304) 340-3170', counties: ['Randolph'] },
  { district: '62', chamber: 'House', name: 'Ty Nestor', party: 'R', email: 'ty.nestor@wvhouse.gov', phone: '(304) 340-3170', counties: ['Randolph', 'Pendleton'] },
  { district: '63', chamber: 'House', name: 'Phil Mallow', party: 'R', email: 'phil.mallow@wvhouse.gov', phone: '(304) 340-3170', counties: ['Tucker', 'Preston'] },
  { district: '64', chamber: 'House', name: 'Buck Jennings', party: 'R', email: 'buck.jennings@wvhouse.gov', phone: '(304) 340-3170', counties: ['Preston'] },
  { district: '65', chamber: 'House', name: 'Guy Ward', party: 'R', email: 'guy.ward@wvhouse.gov', phone: '(304) 340-3170', counties: ['Monongalia'] },
  { district: '66', chamber: 'House', name: 'Joe Statler', party: 'R', email: 'joe.statler@wvhouse.gov', phone: '(304) 340-3170', counties: ['Monongalia'] },
  { district: '67', chamber: 'House', name: 'Evan Hansen', party: 'D', email: 'evan.hansen@wvhouse.gov', phone: '(304) 340-3170', counties: ['Monongalia'] },
  { district: '68', chamber: 'House', name: 'John Williams', party: 'R', email: 'john.williams@wvhouse.gov', phone: '(304) 340-3170', counties: ['Monongalia'] },
  { district: '69', chamber: 'House', name: 'Danielle Waltz', party: 'D', email: 'danielle.waltz@wvhouse.gov', phone: '(304) 340-3170', counties: ['Monongalia'] },
  { district: '70', chamber: 'House', name: 'Barbara Fleischauer', party: 'D', email: 'barbara.fleischauer@wvhouse.gov', phone: '(304) 340-3170', counties: ['Monongalia'] },
  { district: '71', chamber: 'House', name: 'Joey Garcia', party: 'D', email: 'joey.garcia@wvhouse.gov', phone: '(304) 340-3170', counties: ['Marion'] },
  { district: '72', chamber: 'House', name: 'Mike DeVault', party: 'R', email: 'mike.devault@wvhouse.gov', phone: '(304) 340-3170', counties: ['Marion'] },
  { district: '73', chamber: 'House', name: 'Clay Riley', party: 'R', email: 'clay.riley@wvhouse.gov', phone: '(304) 340-3170', counties: ['Harrison', 'Doddridge'] },
  { district: '74', chamber: 'House', name: 'Geno Briscoe', party: 'R', email: 'geno.briscoe@wvhouse.gov', phone: '(304) 340-3170', counties: ['Ritchie', 'Calhoun', 'Wirt'] },
  { district: '75', chamber: 'House', name: 'Mark Ross', party: 'R', email: 'mark.ross@wvhouse.gov', phone: '(304) 340-3170', counties: ['Jackson', 'Roane'] },
  { district: '76', chamber: 'House', name: 'Roger Hanshaw', party: 'R', email: 'roger.hanshaw@wvhouse.gov', phone: '(304) 340-3210', counties: ['Clay', 'Kanawha'] },
  { district: '77', chamber: 'House', name: 'Eric Brooks', party: 'R', email: 'eric.brooks@wvhouse.gov', phone: '(304) 340-3170', counties: ['Lewis'] },
  { district: '78', chamber: 'House', name: 'Diana Winzenreid', party: 'R', email: 'diana.winzenreid@wvhouse.gov', phone: '(304) 340-3170', counties: ['Jefferson'] },
  { district: '79', chamber: 'House', name: 'Paul Espinosa', party: 'R', email: 'paul.espinosa@wvhouse.gov', phone: '(304) 340-3170', counties: ['Jefferson'] },
  { district: '80', chamber: 'House', name: 'Sam Brown', party: 'R', email: 'sam.brown@wvhouse.gov', phone: '(304) 340-3170', counties: ['Jefferson'] },
  { district: '81', chamber: 'House', name: 'John Doyle', party: 'D', email: 'john.doyle@wvhouse.gov', phone: '(304) 340-3170', counties: ['Jefferson'] },
  { district: '82', chamber: 'House', name: 'Wayne Clark', party: 'R', email: 'wayne.clark@wvhouse.gov', phone: '(304) 340-3170', counties: ['Berkeley'] },
  { district: '83', chamber: 'House', name: 'George Miller', party: 'R', email: 'george.miller@wvhouse.gov', phone: '(304) 340-3170', counties: ['Berkeley'] },
  { district: '84', chamber: 'House', name: 'Caleb Hanna', party: 'R', email: 'caleb.hanna@wvhouse.gov', phone: '(304) 340-3170', counties: ['Berkeley'] },
  { district: '85', chamber: 'House', name: 'Jason Barrett', party: 'R', email: 'jason.barrett@wvhouse.gov', phone: '(304) 340-3170', counties: ['Berkeley'] },
  { district: '86', chamber: 'House', name: 'Elias Coop-Gonzalez', party: 'R', email: 'elias.coopgonzalez@wvhouse.gov', phone: '(304) 340-3170', counties: ['Berkeley'] },
  { district: '87', chamber: 'House', name: 'John Hardy', party: 'R', email: 'john.hardy@wvhouse.gov', phone: '(304) 340-3129', counties: ['Berkeley'] },
  { district: '88', chamber: 'House', name: 'John Mandt', party: 'R', email: 'john.mandt@wvhouse.gov', phone: '(304) 340-3170', counties: ['Berkeley'] },
  { district: '89', chamber: 'House', name: 'Alex Korenoski', party: 'R', email: 'alex.korenoski@wvhouse.gov', phone: '(304) 340-3170', counties: ['Berkeley', 'Morgan'] },
  { district: '90', chamber: 'House', name: 'John Paul Hott', party: 'R', email: 'johnpaul.hott@wvhouse.gov', phone: '(304) 340-3170', counties: ['Hampshire', 'Morgan'] },
  { district: '91', chamber: 'House', name: 'Geoff Foster', party: 'R', email: 'geoff.foster@wvhouse.gov', phone: '(304) 340-3170', counties: ['Putnam', 'Kanawha'] },
  { district: '92', chamber: 'House', name: 'Adam Burkhammer', party: 'R', email: 'adam.burkhammer@wvhouse.gov', phone: '(304) 340-3170', counties: ['Lewis', 'Gilmer', 'Braxton'] },
  { district: '93', chamber: 'House', name: 'Todd Kirby', party: 'R', email: 'todd.kirby@wvhouse.gov', phone: '(304) 340-3170', counties: ['Raleigh', 'Fayette'] },
  { district: '94', chamber: 'House', name: 'Daniel Linville', party: 'R', email: 'daniel.linville@wvhouse.gov', phone: '(304) 340-3170', counties: ['Cabell'] },
  { district: '95', chamber: 'House', name: 'Mark Hurt', party: 'R', email: 'mark.hurt@wvhouse.gov', phone: '(304) 340-3170', counties: ['Harrison'] },
  { district: '96', chamber: 'House', name: 'Chris Phillips', party: 'R', email: 'chris.phillips@wvhouse.gov', phone: '(304) 340-3170', counties: ['Roane', 'Jackson'] },
  { district: '97', chamber: 'House', name: 'Clayton Rose', party: 'R', email: 'clayton.rose@wvhouse.gov', phone: '(304) 340-3170', counties: ['Fayette'] },
  { district: '98', chamber: 'House', name: 'Kathleen Lane', party: 'R', email: 'kathleen.lane@wvhouse.gov', phone: '(304) 340-3170', counties: ['Kanawha'] },
  { district: '99', chamber: 'House', name: 'Robbie Morris', party: 'R', email: 'robbie.morris@wvhouse.gov', phone: '(304) 340-3170', counties: ['Wood'] },
  { district: '100', chamber: 'House', name: 'Jarred Cannon', party: 'R', email: 'jarred.cannon@wvhouse.gov', phone: '(304) 340-3170', counties: ['Webster', 'Nicholas', 'Pocahontas'] },
];

const COUNTY_TO_ZIP_PREFIX: Record<string, string[]> = {
  'Barbour': ['263'],
  'Berkeley': ['254', '255'],
  'Boone': ['251', '255'],
  'Braxton': ['264', '266'],
  'Brooke': ['260'],
  'Cabell': ['257'],
  'Calhoun': ['261'],
  'Clay': ['251', '255'],
  'Doddridge': ['263'],
  'Fayette': ['258', '259'],
  'Gilmer': ['262'],
  'Grant': ['268'],
  'Greenbrier': ['249'],
  'Hampshire': ['267'],
  'Hancock': ['260'],
  'Hardy': ['268'],
  'Harrison': ['263', '264'],
  'Jackson': ['251', '253'],
  'Jefferson': ['254'],
  'Kanawha': ['250', '251', '253'],
  'Lewis': ['264'],
  'Lincoln': ['255'],
  'Logan': ['256'],
  'Marion': ['265'],
  'Marshall': ['260'],
  'Mason': ['251', '253'],
  'McDowell': ['248'],
  'Mercer': ['247', '248'],
  'Mineral': ['267'],
  'Mingo': ['256'],
  'Monongalia': ['265'],
  'Monroe': ['249'],
  'Morgan': ['254'],
  'Nicholas': ['266'],
  'Ohio': ['260'],
  'Pendleton': ['268'],
  'Pleasants': ['261'],
  'Pocahontas': ['249'],
  'Preston': ['265', '268'],
  'Putnam': ['251', '253'],
  'Raleigh': ['258', '259'],
  'Randolph': ['262', '263'],
  'Ritchie': ['261', '262'],
  'Roane': ['251', '253'],
  'Summers': ['259'],
  'Taylor': ['263', '265'],
  'Tucker': ['262', '268'],
  'Tyler': ['261'],
  'Upshur': ['263'],
  'Wayne': ['255', '256'],
  'Webster': ['266'],
  'Wetzel': ['261'],
  'Wirt': ['261'],
  'Wood': ['261'],
  'Wyoming': ['248'],
};

const EMAIL_TEMPLATE = `Dear [LEGISLATOR_NAME],

I am writing to urge your support for the Breeder Accountability and Regulation for Kindness Act (B.A.R.K. Act), proposed legislation that would comprehensively reform canine welfare in West Virginia.

As your constituent, I believe this bill addresses critical gaps in our current animal welfare system:

**Why the B.A.R.K. Act Matters:**
• Establishes a 14-day "finder immunity" period protecting Good Samaritans who help stray animals
• Requires 24-hour digital posting of impounded animals—modernizing our 1951-era notification laws
• Creates regional animal control authorities to help underserved rural counties pool resources
• Implements universal breeder licensing with welfare standards and mandatory inspections
• Restricts harmful continuous tethering practices that cause animal suffering

**Key Provisions:**
• Self-funding through license fees—no taxpayer burden
• Consumer protections against puppy mill abuses
• Supports responsible breeders while cracking down on bad actors
• Mandatory microchip scanning at intake to reunite lost pets with owners faster

West Virginia has 55 counties with vastly different animal welfare resources. The B.A.R.K. Act provides the framework to ensure every community—urban and rural—can protect animals humanely.

I respectfully ask that you:
1. Co-sponsor the B.A.R.K. Act when introduced
2. Support its passage through committee
3. Vote YES on the floor

Thank you for your service to our community and your consideration of this important animal welfare legislation.

Sincerely,
[YOUR_NAME]
[YOUR_ADDRESS]
[YOUR_CITY], WV [YOUR_ZIP]
[YOUR_PHONE]`;

const PHONE_SCRIPT = `Hello, my name is [YOUR NAME] and I'm a constituent from [CITY/TOWN].

I'm calling to ask [SENATOR/DELEGATE NAME] to support the B.A.R.K. Act—the Breeder Accountability and Regulation for Kindness Act.

This bill would:
• Protect Good Samaritans who help stray animals with a 14-day finder immunity period
• Require shelters to post found animals online within 24 hours
• Help rural counties pool resources for animal control
• License breeders and require humane standards

Can I count on [SENATOR/DELEGATE NAME] to co-sponsor and support this important animal welfare legislation?

[PAUSE FOR RESPONSE]

Thank you for your time. Please let [SENATOR/DELEGATE NAME] know that animal welfare is important to voters in this district.`;

const SOCIAL_POSTS = {
  twitter: `🐕 Support the #BARKAct for West Virginia! 

This bill would:
✅ Protect Good Samaritans helping strays (14-day immunity)
✅ Modernize shelter notification (24hr digital posting)
✅ Help rural counties with animal control
✅ License breeders with humane standards

Contact your WV legislator today! #WVpol #AnimalWelfare`,
  facebook: `🐾 West Virginia needs the B.A.R.K. Act! 🐾

The Breeder Accountability and Regulation for Kindness Act would transform animal welfare in our state:

🏠 14-day "finder immunity" for Good Samaritans
📱 24-hour digital posting requirement for shelters
🤝 Regional authorities for rural counties
✅ Breeder licensing with welfare standards
⛓️ Anti-tethering protections

This is comprehensive, self-funding reform that protects animals WITHOUT burdening taxpayers.

Contact your state legislators and ask them to support the B.A.R.K. Act!

#BARKAct #WestVirginia #AnimalWelfare #EndPuppyMills`,
};

export default function AdvocacyPage() {
  const [selectedCounty, setSelectedCounty] = useState<string>('');
  const [legislators, setLegislators] = useState<typeof WV_LEGISLATORS>([]);
  const [emailContent, setEmailContent] = useState(EMAIL_TEMPLATE);
  const [copied, setCopied] = useState<string | null>(null);

  const counties = Object.keys(COUNTY_TO_ZIP_PREFIX).sort();

  const findLegislators = () => {
    if (!selectedCounty) return;
    const found = WV_LEGISLATORS.filter(l => l.counties.includes(selectedCounty));
    setLegislators(found);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Hero */}
      <div className="bg-gradient-to-r from-amber-900/40 to-green-900/40 border-b border-amber-700">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <Link href="/" className="text-amber-400 text-sm hover:underline">← Back to PetMayday</Link>
          <h1 className="text-4xl font-bold mt-4">🐕 Advocacy Center</h1>
          <p className="text-xl text-zinc-300 mt-2">Support the B.A.R.K. Act for West Virginia</p>
          <p className="text-sm text-zinc-400 mt-1">Breeder Accountability and Regulation for Kindness Act</p>
          
          {/* Call to Action - no fake stats */}
          <div className="mt-6 text-sm text-zinc-400">
            <p>Your voice matters. Contact your legislators today.</p>
          </div>
          
          {/* BARK Act CTA */}
          <div className="mt-6">
            <Link 
              href="/advocacy/bark-act" 
              className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-black font-bold px-6 py-3 rounded-lg transition-colors text-lg"
            >
              🐕 Learn About the BARK Act
            </Link>
            <p className="text-xs text-zinc-400 mt-2">
              Comprehensive canine welfare reform for West Virginia
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a 
            href="https://resist.bot/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-blue-900/30 border border-blue-700 rounded-lg p-5 hover:bg-blue-900/50 transition-colors"
          >
            <div className="text-2xl mb-2">📱</div>
            <div className="font-semibold text-blue-300">Resistbot</div>
            <p className="text-xs text-zinc-400 mt-1">
              Third-party service. Text RESIST to 50409, then compose your own message about the B.A.R.K. Act using our template below.
            </p>
          </a>
          
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-5">
            <div className="text-2xl mb-2">📞</div>
            <div className="font-semibold text-green-300">Call Your Rep</div>
            <p className="text-xs text-zinc-400 mt-1">
              Find your legislator below, then use our phone script to call them directly.
            </p>
          </div>
          
          <a 
            href="https://countable.us/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-purple-900/30 border border-purple-700 rounded-lg p-5 hover:bg-purple-900/50 transition-colors"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="font-semibold text-purple-300">Track on Countable</div>
            <p className="text-xs text-zinc-400 mt-1">
              Follow bill progress and get notified when action is needed.
            </p>
          </a>
        </div>

        {/* Legislator Finder */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">🔍 Find Your Legislators</h2>
          <p className="text-sm text-zinc-400 mb-4">Select your county to find your WV State Senator and House Delegates.</p>
          
          <div className="flex gap-3 items-center flex-wrap">
            <select
              value={selectedCounty}
              onChange={(e) => setSelectedCounty(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 min-w-[200px]"
            >
              <option value="">Select your county...</option>
              {counties.map(county => (
                <option key={county} value={county}>{county} County</option>
              ))}
            </select>
            <button
              onClick={findLegislators}
              className="bg-amber-600 hover:bg-amber-700 text-black font-medium px-6 py-2 rounded-lg transition-colors"
            >
              Find Legislators
            </button>
          </div>

          {legislators.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-semibold text-zinc-300">Your Representatives:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {legislators.map((leg, idx) => (
                  <div key={idx} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{leg.name}</div>
                        <div className="text-xs text-zinc-500">
                          {leg.chamber} District {leg.district} • {leg.party === 'R' ? 'Republican' : 'Democrat'}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${leg.party === 'R' ? 'bg-red-900/50 text-red-300' : 'bg-blue-900/50 text-blue-300'}`}>
                        {leg.party}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <a 
                        href={`mailto:${leg.email}?subject=Please Support the B.A.R.K. Act`}
                        className="text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded"
                      >
                        ✉️ Email
                      </a>
                      <a 
                        href={`tel:${leg.phone}`}
                        className="text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded"
                      >
                        📞 {leg.phone}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              {legislators.length === 0 && selectedCounty && (
                <p className="text-zinc-500 text-sm">
                  We don't have complete data for {selectedCounty} County yet. 
                  Use <a href="https://www.wvlegislature.gov/Senate1/roster.cfm" target="_blank" className="text-amber-400 hover:underline">wvlegislature.gov</a> to find your representatives.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Email Template */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">✉️ Email Template</h2>
            <button
              onClick={() => copyToClipboard(emailContent, 'email')}
              className={`text-xs px-3 py-1 rounded ${copied === 'email' ? 'bg-green-600' : 'bg-zinc-700 hover:bg-zinc-600'}`}
            >
              {copied === 'email' ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          <p className="text-sm text-zinc-400 mb-3">Customize this template with your information, then send to your legislators.</p>
          <textarea
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
            className="w-full h-96 bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-sm font-mono resize-y"
          />
        </div>

        {/* Phone Script */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">📞 Phone Script</h2>
            <button
              onClick={() => copyToClipboard(PHONE_SCRIPT, 'phone')}
              className={`text-xs px-3 py-1 rounded ${copied === 'phone' ? 'bg-green-600' : 'bg-zinc-700 hover:bg-zinc-600'}`}
            >
              {copied === 'phone' ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          <p className="text-sm text-zinc-400 mb-3">Use this script when calling your legislators. Calls are more impactful than emails!</p>
          <pre className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-sm whitespace-pre-wrap overflow-x-auto">
            {PHONE_SCRIPT}
          </pre>
        </div>

        {/* Social Sharing */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">📣 Share on Social Media</h2>
          <p className="text-sm text-zinc-400 mb-4">Spread the word! Use these pre-written posts or customize your own.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Twitter/X */}
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">𝕏 Twitter/X</span>
                <button
                  onClick={() => copyToClipboard(SOCIAL_POSTS.twitter, 'twitter')}
                  className={`text-xs px-2 py-0.5 rounded ${copied === 'twitter' ? 'bg-green-600' : 'bg-zinc-700 hover:bg-zinc-600'}`}
                >
                  {copied === 'twitter' ? '✓' : '📋'}
                </button>
              </div>
              <p className="text-xs text-zinc-400 whitespace-pre-wrap">{SOCIAL_POSTS.twitter}</p>
              <a 
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(SOCIAL_POSTS.twitter)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded"
              >
                Post to X →
              </a>
            </div>

            {/* Facebook */}
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">📘 Facebook</span>
                <button
                  onClick={() => copyToClipboard(SOCIAL_POSTS.facebook, 'facebook')}
                  className={`text-xs px-2 py-0.5 rounded ${copied === 'facebook' ? 'bg-green-600' : 'bg-zinc-700 hover:bg-zinc-600'}`}
                >
                  {copied === 'facebook' ? '✓' : '📋'}
                </button>
              </div>
              <p className="text-xs text-zinc-400 whitespace-pre-wrap line-clamp-6">{SOCIAL_POSTS.facebook}</p>
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(SOCIAL_POSTS.facebook)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded"
              >
                Share on Facebook →
              </a>
            </div>
          </div>

          {/* Hashtags */}
          <div className="mt-4 p-3 bg-zinc-800/30 rounded-lg">
            <div className="text-xs text-zinc-500 mb-2">Suggested Hashtags:</div>
            <div className="flex flex-wrap gap-2">
              {['#BARKAct', '#WVpol', '#AnimalWelfare', '#EndPuppyMills', '#WestVirginia', '#PetMayday'].map(tag => (
                <span key={tag} className="text-xs bg-zinc-700 text-amber-300 px-2 py-1 rounded">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* B.A.R.K. Act Summary */}
        <div className="bg-gradient-to-r from-amber-900/20 to-green-900/20 border border-amber-800/50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">📋 B.A.R.K. Act Quick Facts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-amber-300 mb-2">What It Does</h3>
              <ul className="space-y-1 text-zinc-400">
                <li>✅ 14-day finder immunity for Good Samaritans</li>
                <li>✅ 24-hour digital posting of impounded animals</li>
                <li>✅ Universal breeder licensing (no exemptions)</li>
                <li>✅ Maximum 20 breeding dogs per operation</li>
                <li>✅ Tethering limited to 10 hours per day</li>
                <li>✅ Regional authorities for rural counties</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-green-300 mb-2">Why It Matters</h3>
              <ul className="space-y-1 text-zinc-400">
                <li>🐕 Protects animals from puppy mills</li>
                <li>🏠 Empowers citizens to help strays safely</li>
                <li>📱 Modernizes 1951-era notification laws</li>
                <li>💰 Self-funding—no taxpayer burden</li>
                <li>🤝 Helps underserved rural counties</li>
                <li>⚖️ Consumer protection for pet buyers</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-700">
            <Link href="/admin/sysop/compliance" className="text-amber-400 hover:underline text-sm">
              View full B.A.R.K. Act summary in Compliance & Resources →
            </Link>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-lg font-bold mb-3">💡 Advocacy Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-400">
            <div>
              <h4 className="text-zinc-300 font-medium">Be Personal</h4>
              <p className="text-xs mt-1">Share why animal welfare matters to you. Personal stories are more compelling than form letters.</p>
            </div>
            <div>
              <h4 className="text-zinc-300 font-medium">Be Specific</h4>
              <p className="text-xs mt-1">Ask for a specific action: "Will you co-sponsor the B.A.R.K. Act?"</p>
            </div>
            <div>
              <h4 className="text-zinc-300 font-medium">Be Respectful</h4>
              <p className="text-xs mt-1">Staff remember polite constituents. Anger doesn't change votes.</p>
            </div>
            <div>
              <h4 className="text-zinc-300 font-medium">Follow Up</h4>
              <p className="text-xs mt-1">If you call, send an email too. If they commit, thank them publicly.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6 text-xs text-zinc-500">
          <p>This advocacy page is provided by PetMayday / PROVENIQ Foundation</p>
          <p className="mt-1">Not affiliated with any political party or campaign</p>
        </div>
      </div>
    </div>
  );
}
