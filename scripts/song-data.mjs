export const normalizeTitle = (title = "") => {
	if (!title) return "";
	return title
		.toLowerCase()
		.replace(/&/g, "and")
		.replace(/\([^\)]*\)/g, "")
		.replace(/[^a-z0-9]+/g, "")
		.replace(/the/g, "the")
		.trim();
};

export const isLooseMatch = (a, b) => {
	if (!a || !b) return false;
	if (a === b) return true;
	const shorter = Math.min(a.length, b.length);
	if (shorter < 6) return false;
	return a.includes(b) || b.includes(a);
};

export const manualOverrides = new Map([
	[normalizeTitle("5 o'clock Somewhere"), {
		key: "F",
		bpm: "114",
		ug: "https://tabs.ultimate-guitar.com/tab/alan-jackson/its-five-oclock-somewhere-chords-177062",
		lyrics: "https://genius.com/Alan-jackson-its-five-oclock-somewhere-lyrics"
	}],
	[normalizeTitle("Boot Scootin Boogie"), {
		key: "A",
		bpm: "184",
		ug: "https://tabs.ultimate-guitar.com/tab/brooks-and-dunn/boot-scootin-boogie-chords-15953",
		lyrics: "https://genius.com/Brooks-and-dunn-boot-scootin-boogie-lyrics"
	}],
	[normalizeTitle("Born to Run"), {
		key: "E",
		bpm: "148",
		ug: "https://tabs.ultimate-guitar.com/tab/bruce-springsteen/born-to-run-chords-12180",
		lyrics: "https://genius.com/Bruce-springsteen-born-to-run-lyrics"
	}],
	[normalizeTitle("Brick House"), {
		key: "Ab",
		bpm: "109",
		ug: "https://tabs.ultimate-guitar.com/tab/commodores/brick-house-chords-35619",
		lyrics: "https://genius.com/Commodores-brick-house-lyrics"
	}],
	[normalizeTitle("Callin On Baton Rouge"), {
		key: "D",
		bpm: "176",
		ug: "https://tabs.ultimate-guitar.com/tab/garth-brooks/callin-baton-rouge-chords-81480",
		lyrics: "https://genius.com/Garth-brooks-callin-baton-rouge-lyrics"
	}],
	[normalizeTitle("Can't Stop the Feeling"), {
		key: "C",
		bpm: "113",
		ug: "https://tabs.ultimate-guitar.com/tab/justin-timberlake/cant-stop-the-feeling-chords-1772376",
		lyrics: "https://genius.com/Justin-timberlake-cant-stop-the-feeling-lyrics"
	}],
	[normalizeTitle("Can't Take My Eyes off of You"), {
		key: "F",
		bpm: "128",
		ug: "https://tabs.ultimate-guitar.com/tab/frankie-valli/cant-take-my-eyes-off-you-chords-86053",
		lyrics: "https://genius.com/Frankie-valli-cant-take-my-eyes-off-you-lyrics"
	}],
	[normalizeTitle("Come Sail Away"), {
		key: "C",
		bpm: "132",
		ug: "https://tabs.ultimate-guitar.com/tab/styx/com-sail-away-chords-165023",
		lyrics: "https://genius.com/Styx-come-sail-away-lyrics"
	}],
	[normalizeTitle("Copperhead Road"), {
		key: "D",
		bpm: "124",
		ug: "https://tabs.ultimate-guitar.com/tab/steve-earle/copperhead-road-chords-11082",
		lyrics: "https://genius.com/Steve-earle-copperhead-road-lyrics"
	}],
	[normalizeTitle("Crazy Little Thing Called Love"), {
		key: "D",
		bpm: "160",
		ug: "https://tabs.ultimate-guitar.com/tab/queen/crazy-little-thing-called-love-chords-14364",
		lyrics: "https://genius.com/Queen-crazy-little-thing-called-love-lyrics"
	}],
	[normalizeTitle("Cupid Shuffle"), {
		key: "Fm",
		bpm: "144",
		ug: "https://tabs.ultimate-guitar.com/tab/cupid/cupid-shuffle-chords-1056638",
		lyrics: "https://genius.com/Cupid-cupid-shuffle-lyrics"
	}],
	[normalizeTitle("December, 1963"), {
		key: "F",
		bpm: "106",
		ug: "https://tabs.ultimate-guitar.com/tab/the-four-seasons/december-1963-oh-what-a-night-chords-194135",
		lyrics: "https://genius.com/The-four-seasons-december-1963-oh-what-a-night-lyrics"
	}],
	[normalizeTitle("Escape (The Pina Colada Song)"), {
		key: "D",
		bpm: "100",
		ug: "https://tabs.ultimate-guitar.com/tab/rupert-holmes/escape-the-pina-colada-song-chords-11800",
		lyrics: "https://genius.com/Rupert-holmes-escape-the-pina-colada-song-lyrics"
	}],
	[normalizeTitle("Eye of the Tiger"), {
		key: "Cm",
		bpm: "109",
		ug: "https://tabs.ultimate-guitar.com/tab/survivor/eye-of-the-tiger-chords-36957",
		lyrics: "https://genius.com/Survivor-eye-of-the-tiger-lyrics"
	}],
	[normalizeTitle("Fat Bottom Girls"), {
		key: "C",
		bpm: "89",
		ug: "https://tabs.ultimate-guitar.com/tab/queen/fat-bottomed-girls-chords-86314",
		lyrics: "https://genius.com/Queen-fat-bottomed-girls-lyrics"
	}],
	[normalizeTitle("Happy"), {
		key: "F",
		bpm: "160",
		ug: "https://tabs.ultimate-guitar.com/tab/pharrell-williams/happy-chords-1455797",
		lyrics: "https://genius.com/Pharrell-williams-happy-lyrics"
	}],
	[normalizeTitle("I Believe in a Thing Called Love"), {
		key: "D",
		bpm: "160",
		ug: "https://tabs.ultimate-guitar.com/tab/the-darkness/i-believe-in-a-thing-called-love-chords-17683",
		lyrics: "https://genius.com/The-darkness-i-believe-in-a-thing-called-love-lyrics"
	}],
	[normalizeTitle("I Got a Feeling"), {
		key: "G",
		bpm: "128",
		ug: "https://tabs.ultimate-guitar.com/tab/black-eyed-peas/i-gotta-feeling-chords-846620",
		lyrics: "https://genius.com/The-black-eyed-peas-i-gotta-feeling-lyrics"
	}],
	[normalizeTitle("I Wanna Dance with Somebody"), {
		key: "F#",
		bpm: "119",
		ug: "https://tabs.ultimate-guitar.com/tab/whitney-houston/i-wanna-dance-with-somebody-chords-142577",
		lyrics: "https://genius.com/Whitney-houston-i-wanna-dance-with-somebody-lyrics"
	}],
	[normalizeTitle("I Want It That Way"), {
		key: "F#",
		bpm: "99",
		ug: "https://tabs.ultimate-guitar.com/tab/backstreet-boys/i-want-it-that-way-chords-15369",
		lyrics: "https://genius.com/Backstreet-boys-i-want-it-that-way-lyrics"
	}],
	[normalizeTitle("I Want to Hold Your Hand"), {
		key: "G",
		bpm: "130",
		ug: "https://tabs.ultimate-guitar.com/tab/the-beatles/i-want-to-hold-your-hand-chords-45867",
		lyrics: "https://genius.com/The-beatles-i-want-to-hold-your-hand-lyrics"
	}],
	[normalizeTitle("I Will Survive"), {
		key: "Am",
		bpm: "117",
		ug: "https://tabs.ultimate-guitar.com/tab/gloria-gaynor/i-will-survive-chords-89449",
		lyrics: "https://genius.com/Gloria-gaynor-i-will-survive-lyrics"
	}],
	[normalizeTitle("Isn't She Lovely"), {
		key: "E",
		bpm: "126",
		ug: "https://tabs.ultimate-guitar.com/tab/stevie-wonder/isnt-she-lovely-chords-117337",
		lyrics: "https://genius.com/Stevie-wonder-isnt-she-lovely-lyrics"
	}],
	[normalizeTitle("It's Raining Men"), {
		key: "Gm",
		bpm: "122",
		ug: "https://tabs.ultimate-guitar.com/tab/the-weather-girls/its-raining-men-chords-118582",
		lyrics: "https://genius.com/The-weather-girls-its-raining-men-lyrics"
	}],
	[normalizeTitle("Just a Friend"), {
		key: "C",
		bpm: "96",
		ug: "https://tabs.ultimate-guitar.com/tab/biz-markie/just-a-friend-chords-80804",
		lyrics: "https://genius.com/Biz-markie-just-a-friend-lyrics"
	}],
	[normalizeTitle("Let It Be"), {
		key: "C",
		bpm: "72",
		ug: "https://tabs.ultimate-guitar.com/tab/the-beatles/let-it-be-chords-42431",
		lyrics: "https://genius.com/The-beatles-let-it-be-lyrics"
	}],
	[normalizeTitle("Like a Virgin"), {
		key: "C",
		bpm: "118",
		ug: "https://tabs.ultimate-guitar.com/tab/madonna/like-a-virgin-chords-10232",
		lyrics: "https://genius.com/Madonna-like-a-virgin-lyrics"
	}],
	[normalizeTitle("Living Next Door to Alice"), {
		key: "G",
		bpm: "116",
		ug: "https://tabs.ultimate-guitar.com/tab/smokie/living-next-door-to-alice-chords-96028",
		lyrics: "https://genius.com/Smokie-living-next-door-to-alice-lyrics"
	}],
	[normalizeTitle("Lose Yourself"), {
		key: "Dm",
		bpm: "171",
		ug: "https://tabs.ultimate-guitar.com/tab/eminem/lose-yourself-chords-16175",
		lyrics: "https://genius.com/Eminem-lose-yourself-lyrics"
	}],
	[normalizeTitle("Never Gonna Give You Up"), {
		key: "B",
		bpm: "113",
		ug: "https://tabs.ultimate-guitar.com/tab/rick-astley/never-gonna-give-you-up-chords-127233",
		lyrics: "https://genius.com/Rick-astley-never-gonna-give-you-up-lyrics"
	}],
	[normalizeTitle("No Scrubs"), {
		key: "Gm",
		bpm: "94",
		ug: "https://tabs.ultimate-guitar.com/tab/tlc/no-scrubs-chords-118558",
		lyrics: "https://genius.com/Tlc-no-scrubs-lyrics"
	}],
	[normalizeTitle("Paradise By the Dashboard Light"), {
		key: "E",
		bpm: "86",
		ug: "https://tabs.ultimate-guitar.com/tab/meat-loaf/paradise-by-the-dashboard-light-chords-11814",
		lyrics: "https://genius.com/Meat-loaf-paradise-by-the-dashboard-light-lyrics"
	}],
	[normalizeTitle("Party Rock"), {
		key: "Fm",
		bpm: "130",
		ug: "https://tabs.ultimate-guitar.com/tab/lmfao/party-rock-anthem-chords-1166265",
		lyrics: "https://genius.com/Lmfao-party-rock-anthem-lyrics"
	}],
	[normalizeTitle("Push It"), {
		key: "Fm",
		bpm: "128",
		ug: "https://tabs.ultimate-guitar.com/tab/salt-n-pepa/push-it-chords-90837",
		lyrics: "https://genius.com/Salt-n-pepa-push-it-lyrics"
	}],
	[normalizeTitle("Redneck Woman"), {
		key: "A",
		bpm: "120",
		ug: "https://tabs.ultimate-guitar.com/tab/gretchen-wilson/redneck-woman-chords-16289",
		lyrics: "https://genius.com/Gretchen-wilson-redneck-woman-lyrics"
	}],
	[normalizeTitle("Rolling in the Deep"), {
		key: "Cm",
		bpm: "105",
		ug: "https://tabs.ultimate-guitar.com/tab/adele/rolling-in-the-deep-chords-1009297",
		lyrics: "https://genius.com/Adele-rolling-in-the-deep-lyrics"
	}],
	[normalizeTitle("Save a Horse (Ride a Cowboy)"), {
		key: "G",
		bpm: "120",
		ug: "https://tabs.ultimate-guitar.com/tab/big-and-rich/save-a-horse-ride-a-cowboy-chords-17065",
		lyrics: "https://genius.com/Big-and-rich-save-a-horse-ride-a-cowboy-lyrics"
	}],
	[normalizeTitle("September"), {
		key: "Ab",
		bpm: "126",
		ug: "https://tabs.ultimate-guitar.com/tab/earth-wind-and-fire/september-chords-22248",
		lyrics: "https://genius.com/Earth-wind-and-fire-september-lyrics"
	}],
	[normalizeTitle("Shoop"), {
		key: "Fm",
		bpm: "99",
		ug: "https://tabs.ultimate-guitar.com/tab/salt-n-pepa/shoop-chords-125919",
		lyrics: "https://genius.com/Salt-n-pepa-shoop-lyrics"
	}],
	[normalizeTitle("Single Ladies"), {
		key: "E",
		bpm: "97",
		ug: "https://tabs.ultimate-guitar.com/tab/beyonce/single-ladies-put-a-ring-on-it-chords-829776",
		lyrics: "https://genius.com/Beyonce-single-ladies-put-a-ring-on-it-lyrics"
	}],
	[normalizeTitle("Sweet Child O Mine"), {
		key: "D",
		bpm: "125",
		ug: "https://tabs.ultimate-guitar.com/tab/guns-n-roses/sweet-child-o-mine-chords-20035",
		lyrics: "https://genius.com/Guns-n-roses-sweet-child-o-mine-lyrics"
	}],
	[normalizeTitle("The Edge of Glory"), {
		key: "G",
		bpm: "128",
		ug: "https://tabs.ultimate-guitar.com/tab/lady-gaga/the-edge-of-glory-chords-1035905",
		lyrics: "https://genius.com/Lady-gaga-the-edge-of-glory-lyrics"
	}],
	[normalizeTitle("Total Eclipse of the Heart"), {
		key: "Ab",
		bpm: "66",
		ug: "https://tabs.ultimate-guitar.com/tab/bonnie-tyler/total-eclipse-of-the-heart-chords-85239",
		lyrics: "https://genius.com/Bonnie-tyler-total-eclipse-of-the-heart-lyrics"
	}],
	[normalizeTitle("Unwritten"), {
		key: "B",
		bpm: "108",
		ug: "https://tabs.ultimate-guitar.com/tab/natasha-bedingfield/unwritten-chords-69263",
		lyrics: "https://genius.com/Natasha-bedingfield-unwritten-lyrics"
	}],
	[normalizeTitle("Wannabe"), {
		key: "B",
		bpm: "110",
		ug: "https://tabs.ultimate-guitar.com/tab/spice-girls/wannabe-chords-10639",
		lyrics: "https://genius.com/Spice-girls-wannabe-lyrics"
	}],
	[normalizeTitle("We Are Family"), {
		key: "Ab",
		bpm: "119",
		ug: "https://tabs.ultimate-guitar.com/tab/sister-sledge/we-are-family-chords-123298",
		lyrics: "https://genius.com/Sister-sledge-we-are-family-lyrics"
	}],
	[normalizeTitle("Yeah"), {
		key: "Cm",
		bpm: "105",
		ug: "https://tabs.ultimate-guitar.com/tab/usher/yeah-chords-87201",
		lyrics: "https://genius.com/Usher-yeah-lyrics"
	}],
	[normalizeTitle("You Can't Always Get What You Want"), {
		key: "C",
		bpm: "97",
		ug: "https://tabs.ultimate-guitar.com/tab/the-rolling-stones/you-cant-always-get-what-you-want-chords-15572",
		lyrics: "https://genius.com/The-rolling-stones-you-cant-always-get-what-you-want-lyrics"
	}],
	[normalizeTitle("I Don't Want to Miss a Thing"), {
		key: "D",
		bpm: "84",
		ug: "https://tabs.ultimate-guitar.com/tab/aerosmith/i-dont-want-to-miss-a-thing-chords-168287",
		lyrics: "https://genius.com/Aerosmith-i-dont-want-to-miss-a-thing-lyrics"
	}],
	[normalizeTitle("Sugar We're Going Down"), {
		key: "D",
		bpm: "163",
		ug: "https://tabs.ultimate-guitar.com/tab/fall-out-boy/sugar-were-goin-down-chords-37420",
		lyrics: "https://genius.com/Fall-out-boy-sugar-were-goin-down-lyrics"
	}],
	[normalizeTitle("Shout"), {
		key: "F",
		bpm: "128",
		ug: "https://tabs.ultimate-guitar.com/tab/the-isley-brothers/shout-chords-244475",
		lyrics: "https://genius.com/The-isley-brothers-shout-lyrics"
	}],
	[normalizeTitle("You Make My Dreams Come True"), {
		key: "F",
		bpm: "171",
		ug: "https://tabs.ultimate-guitar.com/tab/hall-and-oates/you-make-my-dreams-chords-195590",
		lyrics: "https://genius.com/Hall-and-oates-you-make-my-dreams-lyrics"
	}],
	[normalizeTitle("You Make My Dreams"), {
		key: "F",
		bpm: "171",
		ug: "https://tabs.ultimate-guitar.com/tab/hall-and-oates/you-make-my-dreams-chords-195590",
		lyrics: "https://genius.com/Hall-and-oates-you-make-my-dreams-lyrics"
	}]
]);