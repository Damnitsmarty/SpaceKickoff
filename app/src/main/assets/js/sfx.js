

/**
 * @fileoverview Describes the SFX namespace, containing methods for playing and loading Audio
 * @author Martin Kolev
 *
 */
/**
 * @namespace sfx
 * @property {object} sfxArray A dictionary holding all Audio objects
 */

var sfx = {
    sfxArray:{},

    /**
     * Plays the sfx with the given ID
     *
     * @param {string} id               ID of the sfx to be played
     */
    play: function(id){
        var s = sfx.sfxArray[id];
        if(s){
            // return if the sound is a singleton and is already being played
            if(s.singleton == true && s.playing()) return;
            sfx.sfxArray[id].play();
        }
    },
    /**
     * Loads an audio file into the sfx array
     *
     * @param  {string} id                  The ID of the new sfx
     * @param  {string} path                The path to the Audio file
     * @param  {number} [volume=1]          The volume of the audio file
     * @param  {boolean} [loop=false]       Should the audio loop
     * @param  {boolean} [singleton=false]  Cannot be played simultaneously more than once? used for bcg music
     */
    load: function(id, path, volume, loop, singleton){
        sfx.sfxArray[id] = new Howl({
            src:[path],
            volume: volume || 1,
            loop: loop || false,
            //html5:true,
            preload: true,
        });
        if(singleton) sfx.sfxArray[id].singleton = singleton;
    },

}
