'use strict';
const artistIds = require('./artist-ids');
const http = require('http');
const fs = require('fs');
const JSONStream = require('JSONStream');
const limit = 7; // The number of songs to retrieve for each artist
const parser = JSONStream.parse(['results', true]);
const popIds = artistIds.pop;
const rapIds = artistIds.rap;
const rc = require('redis').createClient();
const rockIds = artistIds.rock;
let rooms = require('../config').rooms;
let score;
let skip = 0; // Skip counter
let songId = 0;
let c = 0;
let artists = "";
// const options = {
//   headers: { 'content-type': 'application/json' },
//   host: 'itunes.apple.com',
//   // Look up multiple artists by their IDs and get `limit` songs for each one
//   path:
//     '/lookup?id=' +
//     popIds.concat(rapIds, rockIds).join() +
//     '&entity=song&limit=' +
//     limit,
//   port: 80
// };
/**
 * Set the rooms in which the songs of a given artist will be loaded.
 */
const updateRooms = function(artistId) {
  rooms = ['mixed'];
  score = 0;
  if (artistId === popIds[0]) {
    rooms.push('hits', 'pop');
    // Set the skip counter (there is no need to update the rooms for the next pop artists)
    skip = popIds.length - 1;
  } else if (artistId === rapIds[0]) {
    rooms.push('rap');
    skip = rapIds.length - 1;
  } else {
    rooms.push('oldies', 'rock');
    skip = rockIds.length - 1;
 }
};
parser.on('data', function(track) {
  if (track.wrapperType === 'artist') {
	artists += track.artistId+","+ "//" + track.artistName + "\n";
    if (skip) {
      skip--;
      return;
    }
    updateRooms(track.artistId);
    return;
  }
  // rc.hmset(
  //   'song:' + songId,
  //   'artistName',
  //   track.artistName,
  //   'trackName',
  //   track.trackName,
  //   'trackViewUrl',
  //   track.trackViewUrl,
  //   'previewUrl',
  //   track.previewUrl,
  //   'artworkUrl60',
  //   track.artworkUrl60,
  //   'artworkUrl100',
  //   track.artworkUrl100
  // );

  //process.stdout.write("Song id " + songId + " artistName" +  track.artistName  + " TRACKNAME "  + track.trackName+"\n" );
  rooms.forEach(function(room) {
    const _score = room === 'mixed' ? songId : score;
    rc.zadd(room, _score, songId);
  });
  score++;
  songId++;
});
parser.on('end', function() {
  rc.hgetall("hits", function(err, rep){
    //console.log(rep);
    process.stdout.write(rep);
   });
  rc.quit();
  process.stdout.write('OK\n');
    process.stdout.write('NEOLAN');
  process.stdout.write(artists);

});
rc.del(rooms, function(err) {
  if (err) {
    throw err;
  }
  process.stdout.write('Loading sample tracks... ');
  // http.get(options, function(res) {
  //   res.pipe(parser);
  // });
  var jsonData = 'test2.json',
        stream = fs.createReadStream(jsonData);
  stream.pipe(parser);
  //process.stdout.write(artists);
  rc.hgetall("hits", function(err, rep){
    //console.log(rep);
    process.stdout.write(rep);
   });
});