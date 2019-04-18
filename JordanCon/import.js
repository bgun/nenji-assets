'use strict';

let _ = require('lodash');
let ical = require('ical');
let moment = require('moment-timezone');
let striptags = require('striptags');


let con_info = require("./con_info.json");

let calendarFiles = [{
  trackName: 'Art & Artists Track',
  icalUrl: 'https://calendar.google.com/calendar/ical/jordancon.org_d8skdkum7a02gbkvtpaohn559k%40group.calendar.google.com/public/basic.ics'
}, {
  trackName: 'Gaming',
  icalUrl: 'https://calendar.google.com/calendar/ical/jordancon.org_cv04qljf1e2km9blqdpo5h77j0%40group.calendar.google.com/public/basic.ics'
}, {
  default: true,
  trackName: 'Main Programming',
  icalUrl: 'https://calendar.google.com/calendar/ical/jordancon.org_c592mh5celt06liqphrp7gvid0%40group.calendar.google.com/public/basic.ics'
}, {
  trackName: 'Meet-Ups',
  icalUrl: 'https://calendar.google.com/calendar/ical/jordancon.org_thsob38qfsg3bb93ive5i366k8%40group.calendar.google.com/public/basic.ics'
}, {
  trackName: 'Coffee Hour',
  icalUrl: 'https://calendar.google.com/calendar/ical/jordancon.org_b9fidud6o4286kovptbsm23aao%40group.calendar.google.com/public/basic.ics'
}, {
  trackName: 'Sci-Fi Track',
  icalUrl: 'https://calendar.google.com/calendar/ical/jordancon.org_lom64kn7is9ng2pe4dtkfnri80%40group.calendar.google.com/public/basic.ics'
}, {
  trackName: 'Worlds of Brandon Sanderson',
  icalUrl: 'https://calendar.google.com/calendar/ical/jordancon.org_ur15pmmphmrg64dde56ks3056c%40group.calendar.google.com/public/basic.ics'
}, {
  trackName: 'Fantasy Track',
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
}, {
  trackName: 'JordanCon Operations',
  icalUrl: 'https://calendar.google.com/calendar/ical/jordancon.org_iim91qvspmdninrm087o1lbb64%40group.calendar.google.com/public/basic.ics'
}];


// Removes special characters, converts to lowercase, and trims.
// Used to generate name slugs ("John Q. Smith-Public" to "johnqsmithpublic") and compare names.
let makeSlug = function(str) {
  return str.split(' ').join('_').replace(/\W/g,"").toLowerCase().trim();
};

let guestsSet = new Set();

let completedCallback = function(allTracks) {
  let guestsArray = Array.from(guestsSet).map(g => {
    let guest_id = makeSlug(g);
    let guest = _.find(con_info.guests, gg => gg.guest_id === guest_id);
    return {
      name: g,
      guest_id: guest_id,
      bio: guest && guest.bio ? guest.bio : "",
    }
  });
  guestsArray = _.uniqBy(guestsArray, g => g.guest_id);

  con_info.updated_at = moment();
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
      let arr = Object.keys(resp);
      arr = arr.filter(k => {
        return moment(resp[k].start).tz('America/New_York').year() === 2019;
      }).map(k => mapEvent(resp[k]));
      results.push({
        name: cal.trackName,
        default: !!cal.default,
        events: arr
      });
      if (results.length === calendarFiles.length) {
        completedCallback(_.sortBy(results, 'trackName'));
      }
    });
  });
};

main();
