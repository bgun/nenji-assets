'use strict';

let _ = require('lodash');
let ical = require('ical');
let moment = require('moment-timezone');
let striptags = require('striptags');


let con_info = {
	"con_id": "jordancon2018",
	"lat": 33.917376,
	"lon": -84.345061,
	"name": "JordanCon 2018",
	"updated_at": moment(new Date()),
	"_comment": "Remember: This file cannot contain images as require(image) cannot have dynamically generated strings.",
	"images": {
		"DASHBOARD": "https://bgun.github.io/nenji-assets/JordanCon/dashboard.png",
		"HOTEL_MAP": "https://bgun.github.io/nenji-assets/JordanCon/hotel_map.png"
	},
	"content": {
		"aboutText": "<p>The original MystiCon, which took place over July 4th weekend in 1980 was considered a big party by most, but has recently been revived to take place in our favorite Roanoke, VA location, the Tanglewood Holiday Inn. The location and time of year that MystiCon takes place is one that fans, family and friends alike have come to rely on for an awesome weekend of SciFi, Fantasy and Pop Culture.</p><p>This convention was resurrected in 2010 by a collection of cool zany and passionate people that wanted to keep the family-friendly traditions of open gaming, enjoyment of different literature, arts, imaginations and camaraderie any Con-goer will surely enjoy!</p><p>We look forward to seeing you there!</p><p><em>MystiCon is a 501(c)(3) Non Profit Corporation.</em></p>",
		"appText": "<p><strong>Con-Nexus</strong> is a lightweight, open-source convention app framework created by Ben Gundersen, and currently built with React Native. You can find more information on <a href='https://github.com/bgun'>GitHub</a>, or email me: <a href='mailto:ben@bengundersen.com'>ben@bengundersen.com</a>.</p><p><em>Made with &hearts; in New York City</em></p>"
	},
	"dimensions": {
		"HOTEL_MAP_WIDTH": 551,
		"HOTEL_MAP_HEIGHT": 628
	},
	"styles": {},
	"guests": [],
	"events": {}
};



let calendarFiles = [{
  trackName: 'Art Show',
  icalUrl: 'https://calendar.google.com/calendar/ical/jordancon.org_d8skdkum7a02gbkvtpaohn559k%40group.calendar.google.com/public/basic.ics'
}, {
  trackName: 'Gaming',
  icalUrl: 'https://calendar.google.com/calendar/ical/jordancon.org_cv04qljf1e2km9blqdpo5h77j0%40group.calendar.google.com/public/basic.ics'
}, {
  trackName: 'Main Programming',
  icalUrl: 'https://calendar.google.com/calendar/ical/jordancon.org_c592mh5celt06liqphrp7gvid0%40group.calendar.google.com/public/basic.ics'
}, {
  trackName: 'Misc. Events',
  icalUrl: 'https://calendar.google.com/calendar/ical/jordancon.org_thsob38qfsg3bb93ive5i366k8%40group.calendar.google.com/public/basic.ics'
}, {
  trackName: 'Reading & Kaffeeklatches',
  icalUrl: 'https://calendar.google.com/calendar/ical/jordancon.org_b9fidud6o4286kovptbsm23aao%40group.calendar.google.com/public/basic.ics'
}, {
  trackName: 'Rivets & Robots',
  icalUrl: 'https://calendar.google.com/calendar/ical/jordancon.org_lom64kn7is9ng2pe4dtkfnri80%40group.calendar.google.com/public/basic.ics'
}, {
  trackName: 'Sandertrack',
  icalUrl: 'https://calendar.google.com/calendar/ical/jordancon.org_ur15pmmphmrg64dde56ks3056c%40group.calendar.google.com/public/basic.ics'
}, {
  trackName: 'Swords & Sorcery',
  icalUrl: 'https://calendar.google.com/calendar/ical/jordancon.org_8d2lrfhilpdddeogt0eb00a7fk%40group.calendar.google.com/public/basic.ics'
}, {
  trackName: 'Workshops',
  icalUrl: 'https://calendar.google.com/calendar/ical/jordancon.org_jobkogcs6qppld11vl2r6ii81s%40group.calendar.google.com/public/basic.ics'
}, {
  trackName: 'World of the Wheel',
  icalUrl: 'https://calendar.google.com/calendar/ical/jordancon.org_oggmaa9bs59gsmgg0krmhdhfjk%40group.calendar.google.com/public/basic.ics'
},{
  trackName: 'Writers Track',
  icalUrl: 'https://calendar.google.com/calendar/ical/jordancon.org_0eltaaljcli4vujkupnqghpmeo%40group.calendar.google.com/public/basic.ics'
}];


// Removes special characters, converts to lowercase, and trims.
// Used to generate name slugs ("John Q. Smith-Public" to "johnqsmithpublic") and compare names.
let makeSlug = function(str) {
  return str.split(' ').join('_').replace(/\W/g,"").toLowerCase().trim();
};

let guestsSet = new Set();

let completedCallback = function(allTracks) {
  let guestsArray = Array.from(guestsSet).map(g => {
    return {
      name: g,
      guest_id: makeSlug(g)
    }
  });

  con_info.tracks = allTracks;
  con_info.guests = guestsArray;
  console.log(JSON.stringify(con_info));
};

let mapEvent = function(ev) {
  let guests, description;

  if (ev.description) {
    let descParts = striptags(ev.description)
      .split('&nbsp;').join(' ')
      .split('Panelists:');

    description = descParts[0];
    if (descParts.length === 2) {
      guests = descParts[1].split(',').map(s => s.trim());
      guests.forEach(g => {
        guestsSet.add(g);
      });
    }
  }

  return {
    day        : moment(ev.start).tz('America/New_York').format('YYYY-MM-DD'),
    time       : moment(ev.start).tz('America/New_York').format('HH:mm'),
    title      : ev.summary,
    description: description,
    guests     : guests ? guests.map(s => makeSlug(s)) : [],
    event_id   : ev.uid,
    location   : ev.location
  };
}


let main = function() {
  let results = [];
  calendarFiles.forEach(cal => {
    ical.fromURL(cal.icalUrl, {}, (err, resp) => {
      if(err) {
        throw err;
      }
      let arr = Object.keys(resp).map(k => mapEvent(resp[k]));
      results.push({
        name: cal.trackName,
        events: arr
      });
      if (results.length === calendarFiles.length) {
        completedCallback(_.sortBy(results, 'trackName'));
      }
    });
  });
};

main();
