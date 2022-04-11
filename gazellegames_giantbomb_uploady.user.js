// ==UserScript==
// @name         GazelleGames Giantbomb Uploady
// @namespace    https://gazellegames.net/
// @version      0.0.1
// @match        https://gazellegames.net/upload.php
// @match        https://gazellegames.net/torrents.php?action=editgroup*
// @match        https://www.giantbomb.com/*
// @match        http://www.giantbomb.com/*
// @description  Uploady for giantbomb
// @author       FinalDoom
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://raw.githubusercontent.com/tengattack/html2bbcode.js/master/lib/html2bbcode.js
// ==/UserScript==

(function (window, $, {HTML2BBCode}) {
  ('use strict');

  const tagReplacements = [
    {regex: /[ ]/g, replacement: '.'},
    {regex: /action-adventure/, replacement: 'action, adventure'},
    {regex: /snowboarding\/skiing/, replacement: 'snowboarding, skiing'},
    {regex: /track & field/, replacement: 'track.and.field'},
    {
      regex:
        /(baseball|basketball|billiards|bowling|boxing|cricket|football|golf|hockey|skateboarding|snowboarding|skiing|soccer|surfing|tennis|track.and.field|wrestling)/,
      replacement: '$1, sports',
    },
    {regex: /block-breaking/, replacement: 'puzzle'},
    {regex: /brawler/, replacement: 'beat.em.up'},
    {regex: /driving\//, replacement: ''},
    {regex: /Dual-Joystick Shooter/, replacement: 'twin.stick.shooter, shooter'},
    {regex: /role-playing/, replacement: 'role.playing.game'},
    {regex: /-/g, replacement: '.'},
    {regex: /minigame.collection/, replacement: 'minigames'},
    {regex: /moba/, replacement: ''},
    {regex: /music\/rhythm/, replacement: 'music, rhythm'},
    {regex: /'em/, replacement: 'em'},
    {regex: /trivia\/board/, replacement: 'trivia, board'},
    {regex: /,\./g, replacement: ', '},
    {regex: /,.,/g, replacement: ','},
  ];
  const platformReplacements = [
    {regex: /iPhone|iPad|iPod/, replacement: 'iOS'},
    {regex: /PC|Windows Phone/, replacement: 'Windows'},
    {regex: /Xbox 360 Games Store'/, replacement: 'Xbox 360'},
    {regex: /Nintendo Entertainment System'/, replacement: 'NES'},
    {regex: /Nintendo 64DD'/, replacement: 'Nintendo 64'},
    {regex: /GameCube'/, replacement: 'Nintendo GameCube'},
    {regex: /Super Nintendo Entertainment System'/, replacement: 'Super NES'},
    {regex: /Wii Shop'/, replacement: 'Wii'},
    {regex: /PlayStation'/, replacement: 'PlayStation 1'},
    {regex: /PlayStation Network (PS3)'/, replacement: 'PlayStation 3'},
    {regex: /PlayStation Network (PSP)'/, replacement: 'PlayStation Portable'},
    {regex: /PlayStation Network (Vita)'/, replacement: 'PlayStation Vita'},
    {regex: /Sega Master System'/, replacement: 'Master System'},
    {regex: /Genesis'/, replacement: 'Mega Drive'},
    {regex: /Jaguar CD'/, replacement: 'Atari Jaguar'},
    {regex: /Wonderswan'/, replacement: 'Bandai WonderSwan'},
    {regex: /ColecoVision'/, replacement: 'Colecovision'},
    {regex: /Amiga'/, replacement: 'Commodore Amiga'},
    {regex: /Commodore 16'/, replacement: 'Commodore Plus-4'},
    {regex: /Odyssey 2'/, replacement: 'Magnavox-Phillips Odyssey'},
    {regex: /Intellivision'/, replacement: 'Mattel Intellivision'},
    {regex: /NEC PC-6001|NEC PC-8801|NEC PC-9801'/, replacement: 'NEC PC-FX'},
    {regex: /TurboGrafx-16'/, replacement: 'NEC TurboGrafx-16'},
    {regex: /N-Gage'/, replacement: 'Nokia N-Gage'},
    {regex: /Neo Geo'/, replacement: 'SNK Neo Geo'},
    {regex: /Oric'/, replacement: 'Tangerine Oric'},
  ];

  const bbConverter = new HTML2BBCode();
  function html2bb(html) {
    return bbConverter.feed(html).toString();
  }

  function getGameInfo() {
    const imagesUrl = $('.sub-nav .container > ul > li').eq(2).find('a').attr('href');
    const releasesUrl = $('.sub-nav .container > ul > li').eq(6).find('a').attr('href');
    const gameId = $('.sub-nav .container > ul > li').eq(0).find('a').attr('href').split('/')[2];
    const giantbomb = GM_getValue('giantbomb', {});

    // #region Fetch wiki info
    giantbomb.giantbomb = window.location.toString();
    giantbomb.title = $('a.wiki-title').text().trim();
    giantbomb.description = html2bb(
      $('section .wiki-item-display.js-toc-content')
        .html()
        .replace(/\n+/g, '')
        .replace(/<h2\s+[^>]+>/g, '<h2>')
        //.replace(/<div.*/g, '')
        .replace(/<\s*br\s*\/?>/g, '\n'),
    ); //YOU SHOULD NOT DO THIS AT HOME

    giantbomb.tags = $.map($(`#wiki-${gameId}-genres a`), (elem) => $(elem).text().trim())
      .join(', ')
      .toLowerCase();

    const platformsBox = $(`#wiki-${gameId}-platforms`);
    platformsBox.css({border: '2px solid yellow'});
    platformsBox.children('a').click(function (event) {
      event.preventDefault();
      giantbomb.platform = $(this).text();
      platformsBox.css({border: ''});

      // #region Fetch images
      giantbomb.cover = $('.wiki-boxart img').attr('src');
      $.ajax({
        url: imagesUrl,
        success: ({html}) => {
          const galleryMarker = $(html).find('#galleryMarker');
          const galleryId = galleryMarker.attr('data-gallery-id');
          const objectId = galleryMarker.attr('data-object-id');
          $.ajax({
            url: `/js/image-data.json?images=${galleryId}&start=0&count=16&object=${objectId}`,
            success: (data) => {
              giantbomb.screenshots = data.images.map(({original}) => original);
              GM_setValue('giantbomb', giantbomb);
              // #endregion Fetch images

              // #region Fetch release info
              $.ajax({
                url: releasesUrl,
                success: (data) => {
                  const platformTbody = $(data)
                    .find(`td[data-field='platform']:contains('${giantbomb.platform}')`)
                    .parent()
                    .parent();
                  window.asdfasdfasdf = platformTbody;

                  giantbomb.alternate_titles = $.map(
                    $(data)
                      .find('td[data-field="platform"]')
                      .not(`:contains('${giantbomb.platform}')`)
                      .parent()
                      .parent()
                      .find('td[data-field="name"]'),
                    (elem) => $(elem).text().trim().replace(/,/, ''),
                  ).join(', ');

                  giantbomb.rating = platformTbody.find('td[data-field="rating"]').text().trim().replace(/^$/, 'N/A');
                  const releaseTitle = platformTbody.find('td[data-field="name"]').text().trim();
                  if (giantbomb.title !== releaseTitle) {
                    // Add title to alternate titles and use platform title instead
                    if (giantbomb.alternate_titles) {
                      giantbomb.alternate_titles = giantbomb.alternate_titles + ', ' + giantbomb.title;
                    } else {
                      giantbomb.alternate_titles = title;
                    }
                    giantbomb.title = releaseTitle;
                  }
                  giantbomb.year = platformTbody
                    .find('td[data-field="releaseDate"]')
                    .text()
                    .trim()
                    .replace(/.*((?:19|20)\d\d).*/, '$1');

                  GM_setValue('giantbomb', giantbomb);
                  const ggnButton = $('input#save_link');
                  ggnButton.off('click.validate');
                  ggnButton.on('click.complete', () => window.close());
                  ggnButton.val('Close and return to GGn').css({backgroundColor: 'green'});
                },
                error: (error) => {
                  const ggnButton = $('input#save_link');
                  ggnButton.val('Encountered an error getting releases. Check console').css({backgroundColor: 'red'});
                  console.error(error);
                },
              });
            },
            error: (error) => {
              const ggnButton = $('input#save_link');
              ggnButton
                .val('Encountered an error getting images url json. Check console')
                .css({backgroundColor: 'red'});
              console.error(error);
            },
          });
        },
        error: (error) => {
          const ggnButton = $('input#save_link');
          ggnButton.val('Encountered an error getting images page. Check console').css({backgroundColor: 'red'});
          console.error(error);
        },
      });
      // #endregion Fetch release info
      // #endregion Fetch wiki info
    });

    alert('Please click a platform link in the highlighted box.');
  }

  function add_validate_button() {
    GM_addStyle(`
input#save_link {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 999999;
  cursor: pointer;
  height: auto;
  width: auto;
  padding: 10px;
  background-color: lightblue;
}
`);

    if (typeof console != 'undefined' && typeof console.log != 'undefined') console.log('Adding button to window');
    $('body').prepend(
      $('<input type="button" id="save_link" value="Save link for GGn"/>').on('click.validate', getGameInfo),
    );
  }

  // #region Gazelle stuff
  const isNewGroup = () => window.location.pathname === '/upload.php';
  const isEditGroup = () =>
    window.location.pathname === '/torrents.php' && /action=editgroup/.test(window.location.search);
  const isWikiPage = () => window.location.pathname === $('.sub-nav li').eq(0).find('a').attr('href');

  function validateSearchedValues() {
    const giantbomb = GM_getValue('giantbomb', {});
    if (giantbomb.hasOwnProperty('tags'))
      tagReplacements.forEach(({regex, replacement}) => (giantbomb.tags = giantbomb.tags.replace(regex, replacement)));
    if (giantbomb.hasOwnProperty('platform'))
      platformReplacements.forEach(
        ({regex, replacement}) => (giantbomb.platform = giantbomb.platform.replace(regex, replacement)),
      );

    if (isNewGroup()) {
      $('#giantbomburi').val(giantbomb.giantbomb);
      $('#Rating').val(giantbomb.rating);
      $('#aliases').val(giantbomb.alternate_titles);
      $('#title').val(giantbomb.title);
      $('#tags').val(giantbomb.tags);
      $('#year').val(giantbomb.year);
      $('#image').val(giantbomb.cover);
      $('#album_desc').val(giantbomb.description);
      $('#platform').val(giantbomb.platform);

      if (!$('#tags').val().includes(',')) {
        $('#post').attr('style', 'border: 10px solid red');
      }
    } else {
      $("input[name='image']").val(giantbomb.cover);
    }

    const add_screen = $("a:contains('+')");
    const screenshotFields = $("[name='screens[]']").size();
    giantbomb.screenshots.forEach(function (screenshot, index) {
      if (index >= 16) return; //The site doesn't accept more than 16 screenshots
      if (index >= screenshotFields) add_screen.click();
      $("[name='screens[]']").eq(index).val(screenshot); //Finally store the screenshot link in the right screen field.
    });

    GM_deleteValue('giantbomb');
  }

  function add_search_button() {
    $('#dnu_header').parent().attr('style', 'display:none');
    $('#steamid').parent().parent().css({display: 'none'});
    $('#reviews_table').parent().parent().css({display: 'none'});
    $('#empty_group').prop('checked', true).change();

    const titleFieldSelector = `input[name='${isNewGroup() ? 'title' : 'name'}']`;
    $(titleFieldSelector).after(
      $('<input id="giantbomb_uploady_search" type="button" value="Search Giantbomb"/>').click(function () {
        var title = encodeURIComponent($(titleFieldSelector).val());

        window.open(`https://www.giantbomb.com/search/?header=1&i=game&q=${title}`, '_blank'); //For every platform

        GM_setValue('giantbomb', {});
      }),
      $('<input id="giantbomb_uploady_Validate" type="button" value="Validate giantbomb"/>').click(
        validateSearchedValues,
      ),
    );
  }
  // #endregion

  if (window.location.hostname === 'gazellegames.net' && (isNewGroup() || isEditGroup())) {
    add_search_button();
  } else if (window.location.hostname === 'www.giantbomb.com' && isWikiPage()) {
    add_validate_button();
  }
})(unsafeWindow || window, (unsafeWindow || window).jQuery, html2bbcode);
