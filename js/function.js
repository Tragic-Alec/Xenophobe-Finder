simUtils = function() {

    //#region Sim time functions

    // Return a sim's age in dats from a unix timestamp
    function returnSimAge(joinDate) {

        let utcNow = new Date().getTime();
        let now = Math.round(utcNow / 1000);
        return Math.floor((now - joinDate) / 86400);
    }

    // Check if today is sim's birthday (results can be a little fuzzy sometimes)
    function checkIfSimBirthday(simUnix) {

        let utcNow = Math.floor(Date.now() / 1000);

        let dateObjectNow = returnDateObjectFromUNIX(utcNow);
        let simDateObject = returnDateObjectFromUNIX(simUnix);
        let simDayAge = returnSimAge(simUnix);

        // Omit 0 days, reward 1000 days
        if (simDayAge == 0) return false;
        if (simDayAge % 1000 == 0) return true;

        // Check if today is sim's birthday
        if (dateObjectNow.day == simDateObject.day && dateObjectNow.month == simDateObject.month) return true;
        return false;
    }

    // Return format date string from unix timestamp
    function returnDateObjectFromUNIX(unixTime) {

        let utcNow = new Date(new Date().getTime());
        utcNow.setDate(utcNow.getDate() - returnSimAge(unixTime));

        let yyyy = ("" + utcNow.getFullYear()).slice(2);
        let mm = ("0" + (utcNow.getMonth() + 1)).slice(-2);
        let dd = ("0" + (utcNow.getDate())).slice(-2);

        return {month: mm, day: dd, year: yyyy};
    }

    // Format {mm, dd, yyyy} as a fancy string with slashes
    function returnTextDateFromDateObject(dateObject) {

        return dateObject.month + "/" + dateObject.day + "/" + dateObject.year;
    }

    // Return sim time [HH, MM] in a 24 hour format
    function returnSimTime() {

        var date = Date.now() / 1000;
        var minutes = Math.floor((date % 7200) / 5);
        var simHour = Math.floor(minutes / 60);
        var simMin = minutes % 60;

        return [simHour, simMin];
    }
    //#endregion

    //#region Sim/lot state finders

    // Check if sim is in list of known staff sims
    function isSimStaffMember(simName) {

        let simLower = simName.toLowerCase();
        for (let i = 0; i < STAFF_NAMES.length; i++) {

            let staffLower = STAFF_NAMES[i].toLowerCase();
            if (simLower === staffLower) return true;
        }
    }

    // Return if sim floating, hidden, or possibly landed
    function returnExistenceState(selectedSimShort) {

        if ("error" in selectedSimShort) return "OFFLINE";

        const privacyMode = selectedSimShort.privacy_mode;
        const location = selectedSimShort.location;

        // If sim is at a non-zero location
        if (location != 0) {

            // Check if sim is at a job lot
            var isWorking = true;
            for (let i = 0; i < simDataHolder.lotShortList.lots.length; i++) {

                if (simDataHolder.lotShortList.lots[i].location == location) {
                    isWorking = false;
                    break;
                }
            }

            // Is sim at job lot?
            if (isWorking) return "WORKING";
            // Else, sim at regular lot
            else return "LANDED";
        }

        // If location is zero and sim is not hidden, they must be floating
        else if (location == 0 && privacyMode == 0) return "FLOATING"

        // If sim has privacy mode on
        else if (privacyMode == 1) {

            // Check if lot they live at is open
            for (i = 0; i < simDataHolder.lotLongList.lots.length; i++) {

                // If lot sim lives at is online, they might be there
                if (simDataHolder.lotLongList.lots[i].roommates.includes(selectedSimShort.avatar_id)) return "LANDED_HIDDEN";
            }

            // Else, their location is unknown
            return "HIDDEN";
        } 
    }

    // Check if sim present in online-sim database
    function isSimOnline(simName) {

        for (let i = 0; i < simDataHolder.simShortList.avatars.length; i++) {
            
            if (simDataHolder.simShortList.avatars[i].name == simName) return true;
        }
        return false;
    }

    // Return if lot is open or closed
    function returnOpenState(lotLong) {
    
        for (i = 0; i < simDataHolder.lotShortList.lots.length; i++) {
            
            let lotID = simDataHolder.lotShortList.lots[i].lot_id;
            if (lotLong.lot_id == lotID) return simDataHolder.lotShortList.lots[i];
        }
        return {error:"lot not online"};
    }
    //#endregion

    //#region Short/long sim/lot finders

    // Return long lot object from list using location
    function returnLongLotFromLocation(location) {

        for (i = 0; i < simDataHolder.lotLongList.lots.length; i++) {
            
            if (simDataHolder.lotLongList.lots[i].location == location) return simDataHolder.lotLongList.lots[i];
        }
        return {error: "lot not found"};
    }

    // Return short lot object from list using location
    function returnShortLotFromLocation(location) {

        for (i = 0; i < simDataHolder.lotShortList.lots.length; i++) {

            if (simDataHolder.lotShortList.lots[i].location == location) return simDataHolder.lotShortList.lots[i];
        }
        return {error: "lot not found"};
    }

    // Return short sim from sims currently online, from avatar id
    function returnShortSimFromLong(longSim) {

        for (i = 0; i < simDataHolder.simShortList.avatars.length; i++) {

            let simID = simDataHolder.simShortList.avatars[i].avatar_id;
            if (longSim.avatar_id == simID) return simDataHolder.simShortList.avatars[i];
        }
        return {error: "sim not online"};
    }

    // Find lot of online roommate with privacy mode on
    function returnLongLotFromRoommate(simID) {

        for (i = 0; i < simDataHolder.lotLongList.lots.length; i++) {

            if (simDataHolder.lotLongList.lots[i].roommates.includes(simID)) return simDataHolder.lotLongList.lots[i];
        }
    }

    // Return owner sim-object from roommate list
    function returnOwnerFromRoommateList(roommates, owner_id) {

        for (i = 0; i < roommates.avatars.length; i++) {

            if (roommates.avatars[i].avatar_id == owner_id) return roommates.avatars[i];
        }
    }
    //#endregion

    //#region Lot/Sim cache

    // Check if sim is in offline cache
    function checkIfSimInLongCache(simName) {

        simName = simName.toLowerCase()
        for (let i = 0; i < simDataHolder.offlineLongSimList.length; i++) {

            if (simName == simDataHolder.offlineLongSimList[i].name.toLowerCase()) return true;
        }
        return false;
    }

    // Return sim from offline cache
    function returnSimFromLongCache(simName) {

        let simLong;
        simName = simName.toLowerCase();
        for (let i = 0; i < simDataHolder.offlineLongSimList.length; i++) {

            if (simName == simDataHolder.offlineLongSimList[i].name.toLowerCase()) simLong = simDataHolder.offlineLongSimList[i];
        }
        return simLong;
    }

    // Check if lot is in offline cache
    function checkIfLotInLongCache(lotName) {

        lotName = lotName.toLowerCase();
        for (let i = 0; i < simDataHolder.offlineLongLotList.length; i++) {

            if (lotName == simDataHolder.offlineLongLotList[i].name.toLowerCase()) return true;
        }
        return false;
    }

    // Return lot from offline cache
    function returnLotFromLongCache(lotName) {

        let lotLong;
        lotName = lotName.toLowerCase();
        for (let i = 0; i < simDataHolder.offlineLongLotList.length; i++) {

            if (lotName == simDataHolder.offlineLongLotList[i].name.toLowerCase()) lotLong = simDataHolder.offlineLongLotList[i];
        }
        return lotLong;
    }
    //#endregion

    // Return neighborhood name from id
    function returnNeighborhood(nhood_id) {

        return NEIGHBORHOOD[nhood_id - 1];
    }

    // Return array of currently active jobs
    function returnJobsOpen() {

        const simHour = returnSimTime()[0];
        var jobsOpen = [];
        
        if (simHour >= FACTORY_START_TIME && simHour <= FACTORY_END_TIME) jobsOpen.push(1);
        if (simHour >= DINER_START_TIME && simHour <= DINER_END_TIME) jobsOpen.push(2);
        if (simHour >= CLUB_START_TIME || simHour <= CLUB_END_TIME) jobsOpen.push(4, 5);
    
        return jobsOpen;
    }

    // Sort lots/sims by name or age
    function sortEntityList(entityType) {

        if (entityType == "sim") {

            if (simDataHolder.simSort == "age") {

                simDataHolder.simShortList.avatars.sort((a, b) => a.name.localeCompare(b.name));
                simDataHolder.simLongList.avatars.sort((a, b) => a.name.localeCompare(b.name));
                GUI_SORT_SIM_NAMES.style.background = `url(${RES_NAMESORT_SELECTED})`;
                simDataHolder.simSort = "name";
            }
            else if (simDataHolder.simSort == "name") {

                simDataHolder.simShortList.avatars.sort(({avatar_id:a}, {avatar_id:b}) => a - b);
                simDataHolder.simLongList.avatars.sort(({avatar_id:a}, {avatar_id:b}) => a - b);
                GUI_SORT_SIM_NAMES.style.background = `url(${RES_NAMESORT_DESELECTED})`;
                simDataHolder.simSort = "age";
            }
            let simFilter = (simDataHolder.simFilter == "REMOVE") ? "REMOVE" : SIM_FILTER_KEYS[simDataHolder.simFilter];
            filterUtils.writeFilterToTable("sim", simFilter);
        }
        else if (entityType == "lot") {

            if (simDataHolder.lotSort == "pop") {

                simDataHolder.lotShortList.lots.sort((a, b) => a.name.localeCompare(b.name));
                simDataHolder.lotLongList.lots.sort((a, b) => a.name.localeCompare(b.name));
                GUI_SORT_LOT_NAMES.style.background = `url(${RES_NAMESORT_SELECTED})`;
                simDataHolder.lotSort = "name";
            }
            else if (simDataHolder.lotSort == "name") {

                simDataHolder.lotLongList.lots.sort(({avatars_in_lot:a}, {avatars_in_lot:b}) => b - a);
                simDataHolder.lotShortList.lots.sort(({avatars_in_lot:a}, {avatars_in_lot:b}) => b - a);
                GUI_SORT_LOT_NAMES.style.background = `url(${RES_NAMESORT_DESELECTED})`;
                simDataHolder.lotSort = "pop";
            }
            filterUtils.writeFilterToTable("lot", simDataHolder.lotFilter);
        }
    }

    return {
        returnDateObjectFromUNIX: returnDateObjectFromUNIX,
        returnSimAge: returnSimAge,
        isSimOnline: isSimOnline,
        returnShortSimFromLong: returnShortSimFromLong,
        returnExistenceState: returnExistenceState,
        returnLongLotFromLocation: returnLongLotFromLocation,
        returnShortLotFromLocation: returnShortLotFromLocation,
        returnLongLotFromRoommate: returnLongLotFromRoommate,
        returnOwnerFromRoommateList: returnOwnerFromRoommateList,
        returnOpenState: returnOpenState,
        returnJobsOpen: returnJobsOpen,
        returnSimTime: returnSimTime,
        returnNeighborhood: returnNeighborhood,
        returnTextDateFromDateObject: returnTextDateFromDateObject,
        checkIfSimBirthday: checkIfSimBirthday,
        sortEntityList: sortEntityList,
        isSimStaffMember: isSimStaffMember,
        checkIfSimInLongCache: checkIfSimInLongCache,
        returnSimFromLongCache: returnSimFromLongCache,
        checkIfLotInLongCache: checkIfLotInLongCache,
        returnLotFromLongCache: returnLotFromLongCache
    }
}();

domUtils = function() {

    // Get index of element in parent list (TODO: make less hacky)
    function getIndexInParent(element) {

        return Array.from(element.parentNode.children).indexOf(element);
    }

    // Reset style of previously selected element in list
    function resetListSelection() {

        const elements = document.querySelectorAll("*");
        elements.forEach((element) => {
            element.classList.remove("sim-list-node-selected");
            element.classList.remove("sim-in-lot-list-node-selected");
        });
    }

    // Auto size lists to fit screen (TODO: make less hacky)
    function sizeLists() {

        let windowHeight = window.innerHeight;

        var height = Math.max(windowHeight - (GUI_SEARCH_SIM_PANEL.offsetHeight + GUI_FILTER_SIM_PANEL.offsetHeight) - 145, 416);
        height = Math.min(height, 1016);
        var heightPX = height + "px";
        document.getElementById('sims-table').style.maxHeight = heightPX;

        var height = Math.max((windowHeight - (GUI_SEARCH_LOT_PANEL.offsetHeight + GUI_FILTER_LOT_PANEL.offsetHeight) - 261) / 2, 150);
        height = Math.min(height, 450);
        var heightPX = height + "px";
        document.getElementById('lots-table').style.maxHeight = heightPX;
        GUI_BOOKMARK_LIST.style.maxHeight = heightPX;
    }

    // Brute force because my css is bad
    function centerListLabels() {

        let simLabel = document.getElementById("sims-online-count-label");
        let simLabelRect = simLabel.getBoundingClientRect();

        let lotLabel = document.getElementById("lots-online-count-label");
        let lotLabelRect = lotLabel.getBoundingClientRect();

        simLabel.style.marginLeft = `calc(50% - ${simLabelRect.width / 2}px)`;
        lotLabel.style.marginLeft = `calc(50% - ${lotLabelRect.width / 2}px)`;
    }

    // Copy a sim or lot's name to clipboard when clicking the lot/sim bio title element
    function copyTextToClipboard(e) {

        navigator.clipboard.writeText(apiUtils.cleanLink(e.textContent));
    }

    // Swap color modes between light and dark, and save to user settings
    function swapColorMode() {

        if (simDataHolder.userSetting.colorMode == "lightmode") simDataHolder.userSetting.colorMode = "darkmode";
        else if (simDataHolder.userSetting.colorMode == "darkmode") simDataHolder.userSetting.colorMode = "lightmode";

        siteColorMode(simDataHolder.userSetting.colorMode)
        storageUtils.saveStorage(SETTINGS_KEY, JSON.stringify(simDataHolder.userSetting));
    }

    // Change styles of page to reflect currently selected colormode
    function siteColorMode(state) {

        let domRoot = document.querySelector(':root');
        if (state == "lightmode") {

            domRoot.style.setProperty("--bg-fallback", "#7257b2");

            domRoot.style.setProperty("--inset-bg", "#403068");
            domRoot.style.setProperty("--inset-bg-dark", "#403068");
            domRoot.style.setProperty("--block-gradient-light", "#b2a4d4");
            domRoot.style.setProperty("--block-gradient-dark", "#7259b2");
            domRoot.style.setProperty("--outset-title-bg", "#5c469c");

            domRoot.style.setProperty("--bg-dark-gradient-light", "#7259b2");
            domRoot.style.setProperty("--bg-dark-gradient-dark", "#5c469c");
        }
        else if (state == "darkmode") {

            domRoot.style.setProperty("--bg-fallback", "#7ca1bf");

            domRoot.style.setProperty("--inset-bg", "#32455b");
            domRoot.style.setProperty("--inset-bg-dark", "#2f4158");
            domRoot.style.setProperty("--block-gradient-light", "#96bad0");
            domRoot.style.setProperty("--block-gradient-dark", "#5f88af");
            domRoot.style.setProperty("--outset-title-bg", "#5077a3");

            domRoot.style.setProperty("--bg-dark-gradient-light", "#5f88af");
            domRoot.style.setProperty("--bg-dark-gradient-dark", "#476a8d");
        }
    }

    // Build tooltips for elements that need them
    function buildButtonTooltips() {

        addTooltipToButton(GUI_EXPORT_BUTTON, "export");
        addTooltipToButton(GUI_IMPORT_BUTTON, "import");

        addTooltipToButton(GUI_SORT_SIM_NAMES, "sort");
        addTooltipToButton(GUI_SORT_LOT_NAMES, "sort");

        addTooltipToButton(GUI_SEARCH_SIM_BUTTON, "search");
        addTooltipToButton(GUI_SEARCH_LOT_BUTTON, "search");

        addTooltipToButton(GUI_FILTER_SIM_ICON, "min");
        addTooltipToButton(GUI_FILTER_LOT_ICON, "min");
        
        addTooltipToButton(GUI_SIM_HELP_BUTTON, "style-help");
        addTooltipToButton(GUI_COLORMODE_BUTTON, "colormode");

        addTooltipToButton(SIDEBAR_JOB_DINER, "job", "diner");
        addTooltipToButton(SIDEBAR_JOB_CLUB, "job", "club");
        addTooltipToButton(SIDEBAR_JOB_FACTORY, "job", "factory");
    }

    // Create event listener to show an elements tooltips (TODO: make less hacky)
    function addTooltipToButton(element, type, subType) {

        element.addEventListener("mouseover", function() {
    
            filterUtils.mouseOverFilterChange(this, "in", type);
            let tooltip = document.createElement("span");
            tooltip.classList.add("tooltip");

            switch (type) {

                case "export":
                    tooltip.textContent = "Export Bookmarks";
                    tooltip.classList.add("low-tooltip");
                    break;

                case "import":
                    tooltip.textContent = "Import Bookmarks";
                    tooltip.classList.add("low-tooltip");
                    break;

                case "search":
                    tooltip.textContent = "Search";
                    tooltip.classList.add("mid-tooltip");
                    break;
                
                case "sort":
                    tooltip.textContent = "Toggle Alphabetical Sort";
                    tooltip.classList.add("mid-tooltip");
                    break;

                case "min":
                    tooltip.textContent = "Toggle Filters";
                    tooltip.classList.add("low-tooltip");
                    break;

                case "style-help":
                    tooltip.textContent = "Open Sim Panel Formatting Help Page";
                    tooltip.classList.add("under-tooltip");
                    break;

                case "colormode":
                    tooltip.textContent = "Toggle Light";
                    tooltip.classList.add("mid-tooltip");
                    break;

                case "job":
                    let string = ""
                    if      (subType == "diner") string = "Diner Job Activity"
                    else if (subType == "club") string = "Club Job Activity"
                    else if (subType == "factory") string = "Factory Job Activity"
    
                    tooltip.textContent = string;
                    tooltip.classList.add("under-tooltip");
                    tooltip.style.fontSize = "1em";
                    break;
            }
            this.append(tooltip);
        });

        element.addEventListener("mouseout", function(){
    
            if (this.children.length > 0) {

                filterUtils.mouseOverFilterChange(this, "out", type);
                this.removeChild(this.children[0]);
            }
        });
    }

    return {
        getIndexInParent: getIndexInParent,
        resetListSelection: resetListSelection,
        sizeLists: sizeLists,
        copyTextToClipboard: copyTextToClipboard,
        centerListLabels: centerListLabels,
        siteColorMode: siteColorMode,
        buildButtonTooltips: buildButtonTooltips,
        swapColorMode: swapColorMode
    }
}();

eggUtils = function() {

    // Reset sim thumbnail styles
    function resetSimThumbnailStyles() {

        GUI_SIM_VIEW.className = "";

        GUI_SIM_LABEL.className = "";
        GUI_SIM_THUMBNAIL.className = "";
        GUI_SIM_LABEL.classList.add("outset-title", "sim-title");
        GUI_SIM_VIEW.classList.add("div-sim-view", "block-background");

        GUI_SIM_BIO.className = "";
        GUI_SIM_DESCRIPTION.className = "";
        GUI_SIM_BIO.classList.add("thumbnail-bio-holder", "scrollbar");
        GUI_SIM_DESCRIPTION.classList.add("thumbnail-desc-holder");

        GUI_BOOKMARK_LABEL.className = "";
        GUI_BOOKMARK_LABEL.classList.add("bookmark-label");
    }

    // Reset lot thumbnail styles
    function resetLotThumbnailStyles() {

        GUI_LOT_LABEL.className = "";
        GUI_LOT_VIEW.className = "";
        
        GUI_LOT_LABEL.classList.add("outset-title", "thumb-1-1");
        GUI_LOT_VIEW.classList.add("div-thumbnail", "block-background");

        GUI_LOT_DESCRIPTION.className = "";
        GUI_LOT_BIO.className = "";

        GUI_LOT_DESCRIPTION.classList.add("thumbnail-desc-holder", "thumb-2", "lot-thumbnail-info-text");
        GUI_LOT_BIO.classList.add("thumbnail-desc-holder", "thumb-2", "thumbnail-bio-holder", "scrollbar", "lot-thumbnail-bio");
    }

    // Process easter egg when reagan is selected
    function reaganEgg() {

        GUI_SIM_LABEL.classList.add("label-gold");
        GUI_SIM_VIEW.classList.add("block-gold");
        
        GUI_SIM_THUMBNAIL.classList.add("reagan-image");

        GUI_SIM_BIO.classList.add("block-gold");
        GUI_SIM_DESCRIPTION.classList.add("block-gold");

        GUI_BOOKMARK_LABEL.classList.add("bookmark-gold");
    }   

    // Test custom styles with style color sent in argument
    function testCustomStyle(color) {

        // Test specified style
        GUI_SIM_VIEW.classList.add(CUSTOM_STYLE_BLOCK[`b${color}`].cssClass);
        GUI_SIM_LABEL.classList.add(CUSTOM_STYLE_LABEL[`l${color}`].cssClass);
        GUI_SIM_BIO.classList.add(CUSTOM_STYLE_INSET[`i${color}`].cssClass);
        GUI_SIM_DESCRIPTION.classList.add(CUSTOM_STYLE_INSET[`i${color}`].cssClass);
    }

    // Process and set a lot's bio styles
    function handleCustomLotStyles(selectedLot) {

        resetLotThumbnailStyles();

        // Get lot custom styles
        let styleObj = new StyleObject(selectedLot);
        if (styleObj.isBirthday) eggUtils.spawnConfetti("lot", "confetti");
        if (!styleObj.usesStyle) return;

        // Set styles
        if (styleObj.styles.block != "") GUI_LOT_VIEW.classList.add(styleObj.styles.block);
        if (styleObj.styles.label != "") GUI_LOT_LABEL.classList.add(styleObj.styles.label);
        if (styleObj.styles.inset != "") {

            GUI_LOT_BIO.classList.add(styleObj.styles.inset);
            GUI_LOT_DESCRIPTION.classList.add(styleObj.styles.inset);
        }
    }

    // Process and set a sim's bio styles
    function handleCustomSimStyles(selectedSim) {

        resetSimThumbnailStyles();
        GUI_SIM_VIEW.style.display = "flex";

        // Test any custom style
        //testCustomStyle("o");
        //return;

        // If reagan, do easter egg
        if (selectedSim.name == CUSTOM_STYLE_REAGAN) {

            reaganEgg();
            spawnConfetti("sim", "reagan");
        }

        // Get sim's custom styles
        let styleObj = new StyleObject(selectedSim);
        if (styleObj.isBirthday) spawnConfetti("sim", "confetti");
        if (styleObj.isStaff) spawnConfetti("sim", "staff");
        GUI_SIM_THUMBNAIL.src = styleObj.avatarHead;
        if (styleObj.isStaff) GUI_SIM_THUMBNAIL.classList.add("staff-image");

        if (!styleObj.usesStyle) return;
        if (styleObj.styles.block != "") GUI_SIM_VIEW.classList.add(styleObj.styles.block);
        if (styleObj.styles.bookmarkLabel != "") GUI_BOOKMARK_LABEL.classList.add(styleObj.styles.bookmarkLabel);
        if (styleObj.styles.label != "") GUI_SIM_LABEL.classList.add(styleObj.styles.label);
        if (styleObj.styles.inset != "") {

            GUI_SIM_BIO.classList.add(styleObj.styles.inset);
            GUI_SIM_DESCRIPTION.classList.add(styleObj.styles.inset);
        }
    }

    // Spawn confetti if sim is appropriate
    var confettiObjects = new Array();
    function spawnConfetti(entity, type) {

        let confettiData = CONFETTI_DATA[type];
        let parentElement = (entity == "sim") ? GUI_SIM_VIEW : GUI_LOT_VIEW;
        let spawnRect = parentElement.getBoundingClientRect();

        let spawnedConfetti = {
            confettiElements: new Array(),
            timeFired: performance.now()
        }

        for (let i = 0; i < CONFETTI_SPAWN_COUNT; i++) {

            // Create and randomly place confetti container over sim/lot panel
            let confettiNode = document.createElement("div");
            confettiNode.classList.add("confetti-container");

            let spawnX = spawnRect.left + (Math.random() * spawnRect.width);
            let spawnY = spawnRect.top + (Math.random() * spawnRect.height)
            confettiNode.style.left = `${spawnX}px`;
            confettiNode.style.top = `${spawnY}px`;

            let centerX = (spawnRect.width / 2) + spawnRect.left;
            let centerY = (spawnRect.height / 2) + spawnRect.top;
            confettiNode.style.rotate = `${findConfettiAngle(centerX, centerY, spawnX, spawnY)}deg`;

            // Create and assign random image to confetti image
            let confettiImage = document.createElement("div");
            confettiImage.classList.add("confetti-image");
            let imageX = Math.floor(Math.random() * confettiData.sheetWidth);
            let imageY = Math.floor(Math.random() * confettiData.sheetHeight);
            confettiImage.style.background = `url(${confettiData.src}) ${-imageX * 16}px ${-imageY * 16}px`

            // Append to parent element
            confettiNode.append(confettiImage);
            parentElement.append(confettiNode);
            spawnedConfetti.confettiElements.push(confettiNode);
        }
        confettiObjects.push(spawnedConfetti);
        setTimeout(() => {
            eggUtils.removeConfetti();
        }, 950);
    }

    // Despawn confetti after some time (kinda buggy)
    function removeConfetti() {

        if (confettiObjects.length <= 0) return;
        else {
            setTimeout(() => {
                eggUtils.removeConfetti();
            }, 950);
        }

        for (let i = 0; i < confettiObjects[0].confettiElements.length; i++) {

            let element = confettiObjects[0].confettiElements[i];
            element.classList.remove("confetti-container");
            void element.offsetWidth;
            element.parentNode.removeChild(element);
        }
        confettiObjects.shift();
    }

    // Generate random angle for confetti to fly in
    function findConfettiAngle(cx, cy, px, py) {

        let dy = py - cy;
        let dx = px - cx;
        let theta = Math.atan2(dy, dx);
        theta *= 180 / Math.PI;

        return theta;
    }

    return {
        resetSimThumbnailStyles: resetSimThumbnailStyles,
        resetLotThumbnailStyles: resetLotThumbnailStyles,
        handleCustomSimStyles: handleCustomSimStyles,
        handleCustomLotStyles: handleCustomLotStyles,
        spawnConfetti: spawnConfetti,
        removeConfetti: removeConfetti
    }
}();

guiUtils = function() {

    // Write content to target label
    function writeToLabel(contentString, target) {

        const location = document.getElementById(target);
        location.textContent = contentString;
    }

    // Get sims name from a list of sim entries by index (TODO: make less hacky)
    function getSimNameFromList(listElement, index) {

        let simName = listElement.children[index].children[0].textContent;
        return simName;
    }

    //#region Populate Lot/Sim bios

    // Get sim/lot name from index in list, clean and style it
    // Also write sim/lot bio
    // TODO: this does too many things, probably split this up
    async function getIndex(type, selectedName) {

        if (type == "sim") {
    
            // Get sim name from index
            let simName = selectedName;
            simName = apiUtils.cleanLink(simName);
            let selectedSimShort;
            let selectedSimLong = simDataHolder.simLongList.avatars.filter(obj => { return obj.name === simName; });
            selectedSimLong = selectedSimLong[0];

            // Check if sim is online
            if (simUtils.isSimOnline(simName)) {

                // If sim is online, grab short data
                selectedSimShort = simUtils.returnShortSimFromLong(selectedSimLong);
                apiUtils.sendSimEntityAnalytics(selectedSimShort.name, selectedSimShort.avatar_id);
            }
            else {

                // Else, grab long offline data
                if (!simUtils.checkIfSimInLongCache(simName)) {

                    // If sim not in long cache, fetch from API and add to cache
                    let baseURL = `${BASE_URL}/userapi/city/1/avatars/name/`;
                    selectedSimLong = await apiUtils.getAPIData(baseURL + simName.replace(" ", "%20"));
                    simDataHolder.offlineLongSimList.push(selectedSimLong);
                }
                else {

                    // If cached, grab sim data from cache
                    selectedSimLong = simUtils.returnSimFromLongCache(simName);
                }
                
                // Get sim short if available
                selectedSimShort = simUtils.returnShortSimFromLong(selectedSimLong);
                apiUtils.sendSimEntityAnalytics(selectedSimLong.name, selectedSimLong.avatar_id);
            }

            // Send data to sim bio writer
            writeGreaterSimContext(selectedSimShort, selectedSimLong, simUtils.returnExistenceState(selectedSimShort));
        }
        else if (type == "lot") {
            
            // Get lot name from index
            let lotName = selectedName;
            lotName = apiUtils.cleanLink(lotName);
            let selectedLotShort;
            let selectedLotLong;
    
            // Get lot data from online lots by name
            for (let i = 0; i < simDataHolder.lotShortList.lots.length; i++) {
    
                if (simDataHolder.lotShortList.lots[i].name == lotName) {
                    
                    selectedLotShort = simDataHolder.lotShortList.lots[i];
                    selectedLotLong = simUtils.returnLongLotFromLocation(selectedLotShort.location);
                    break;
                }
            }

            // Hide sim bio
            GUI_SIM_VIEW.style.display = "none";
            
            // Write lot data
            writeLotThumbnail(selectedLotShort, selectedLotLong, "");
            writeSimsInLot(selectedLotLong, selectedLotShort.avatars_in_lot);
            apiUtils.sendLotEntityAnalytics(selectedLotShort.name, selectedLotShort.lot_id);
        }
        return;
    }

    // Write sim bio information, write lot bio for the location they are currently at
    function writeGreaterSimContext(selectedSimShort, selectedSimLong, existence) {
        
        // Set bookmark button state, write sim bio
        guiUtils.updateBookmarkButton(selectedSimLong.avatar_id);
        guiUtils.writeSimThumbnail(selectedSimShort, selectedSimLong);
        
        // Show sim bio
        GUI_SIM_VIEW.style.display = "flex";
    
        // Set lot bio based on sim's existence state
        switch (existence){
        
            case "LANDED":
                var selectedShortLot = simUtils.returnShortLotFromLocation(selectedSimShort.location);
                var selectedLongLot = simUtils.returnLongLotFromLocation(selectedSimShort.location);
                writeSimsInLot(selectedLongLot, selectedShortLot.avatars_in_lot);
                break;
        
            case "WORKING":
                var selectedShortLot = {name: "WORKING"};
                GUI_SIMS_IN_LOT.style.display = "none";
                break;
        
            case "FLOATING":
                var selectedShortLot = {name: "FLOATING"};
                GUI_SIMS_IN_LOT.style.display = "none";
                break;
        
            case "LANDED_HIDDEN":
                var selectedLongLot = simUtils.returnLongLotFromRoommate(selectedSimShort.avatar_id);
                var selectedShortLot = simUtils.returnShortLotFromLocation(selectedLongLot.location);
                writeSimsInLot(selectedLongLot, selectedShortLot.avatars_in_lot);
                break;
        
            case "HIDDEN":
                var selectedShortLot = {name: "HIDDEN"};
                GUI_SIMS_IN_LOT.style.display = "none";
                break;
        
            case "OFFLINE":
                var selectedShortLot = {name: "OFFLINE"};
                GUI_SIMS_IN_LOT.style.display = "none";
                break;
        
            default:
                break;
        }
        writeLotThumbnail(selectedShortLot, selectedLongLot, existence, selectedSimLong);
    }

    // Style sims name with a birthday cake or staff wrench
    function returnSimTitle(selectedSimLong) {

        let isBirthday = simUtils.checkIfSimBirthday(selectedSimLong.date);
        let isStaff = simUtils.isSimStaffMember(selectedSimLong.name);

        let birthdayString = (isBirthday) ? " 🎂" : "";
        let staffString = (isStaff) ? " 🔧" : "";

        return `${selectedSimLong.name}${birthdayString}${staffString}`;
    }

    // Style lot name with a birthday cake
    function returnLotTitle(selectedLotLong) {

        let isBirthday = simUtils.checkIfSimBirthday(selectedLotLong.created_date);
        let birthdayString = (isBirthday) ? " 🎂" : "";

        return `${selectedLotLong.name}${birthdayString}`;
    }

    // Build sim bio/thumbnail
    function writeSimThumbnail(selectedSimShort, selectedSimLong) {

        writeToLabel(returnSimTitle(selectedSimLong), "sim-title");
        simDataHolder.selSimID = selectedSimLong.avatar_id;
        eggUtils.handleCustomSimStyles(selectedSimLong);

        // Write sim's bio text
        GUI_SIM_BIO.firstChild.textContent = selectedSimLong.description;

        // Sim description basics
        var descContent = `Age: ${simUtils.returnSimAge(selectedSimLong.date)} Days\n` + 
                          `Joined: ${simUtils.returnTextDateFromDateObject(simUtils.returnDateObjectFromUNIX(selectedSimLong.date))}\n` +
                          `ID: ${selectedSimLong.avatar_id}\n` + 
                          `Job: ${JOB_TITLES[selectedSimLong.current_job]}\n`;

        // Is sim mayor of a neighborhood?
        if (selectedSimLong.mayor_nhood != null) descContent += "Mayor of " + simUtils.returnNeighborhood(selectedSimLong.mayor_nhood) + "\n";

        // Set sim description to constructed text
        GUI_SIM_DESCRIPTION.firstChild.textContent = descContent;

        // Set background of sim and lot thumbnail
        switch (simUtils.returnExistenceState(selectedSimShort)) {

            case "OFFLINE":
                GUI_SIM_THUMBNAIL_BG.classList.add("thumbnail-offline");
                GUI_LOT_THUMBNAIL_BG.classList.add("thumbnail-offline");
                break;

            default:
                GUI_SIM_THUMBNAIL_BG.classList.remove("thumbnail-offline");
                GUI_LOT_THUMBNAIL_BG.classList.remove("thumbnail-offline");
                break;
        }
    }

    // Write info to lot thumbnail box
    async function writeLotThumbnail(selectedLotShort, selectedLotLong, existence, selectedSimLong) {

        // Add click listener to open new tab with selected lot's thumbnail expanded
        GUI_LOT_THUMBNAIL.addEventListener("click", function() {

            let baseURL = window.location.origin;
            let completeURL = `${baseURL}/dramaso-simfinder/lot-inspector.html?lot-id=${selectedLotLong.lot_id}`;

            console.log(completeURL);
            window.open(completeURL);
        });

        // If sim not landed at a lot, contextually fill lot bio
        if ((existence != "LANDED" && existence != "LANDED_HIDDEN") && existence != "") {

            writeAbsentLotThumbnail(existence, selectedSimLong);
            GUI_LOT_BIO.textContent = "";
            GUI_LOT_BIO.style.display = "none";

            return;
        }
        
        // Do custom styles
        eggUtils.handleCustomLotStyles(selectedLotLong);

        // Lot label
        writeToLabel(returnLotTitle(selectedLotLong), "thumbnail-title");

        // Grab lot thumbnail from API
        // TODO: move this to api utils
        let cacheBust = Math.floor(Math.random() * 10000000);
        let imageSource = `${BASE_URL}/userapi/city/1/${selectedLotLong.location}.png?cachebust:${cacheBust}`;
        console.log("%cFetching Lot Image:\n\n", "color: black; background-color: lightgreen;", imageSource);

        // Set image
        GUI_LOT_DESCRIPTION.textContent = "";
        GUI_LOT_THUMBNAIL.src = imageSource;
        simDataHolder.apiStats.incrementAPICalls();

        // Create lot bio elements
        const lotDesc = document.createElement("p");

        // Basic lot info
        lotDesc.textContent = `Category: ${LOT_CATEGORY[selectedLotLong.category]}\n` + 
                              `Established: ${simUtils.returnTextDateFromDateObject(simUtils.returnDateObjectFromUNIX(selectedLotLong.created_date))}\n` + 
                              `Neighborhood: ${simUtils.returnNeighborhood(selectedLotLong.neighborhood_id)}\n` +
                              `Admit Mode: ${ADMIT_MODES[selectedLotLong.admit_mode]}\n` + 
                              `${SKILL_MODES[selectedLotLong.skill_mode]}`;

        // Set thumbnail background and lot population
        let lotOffline = ("error" in simUtils.returnOpenState(selectedLotShort));
        if (lotOffline) GUI_LOT_THUMBNAIL_BG.classList.add("thumbnail-offline");
        else GUI_LOT_THUMBNAIL_BG.classList.remove("thumbnail-offline");

        // Update elements
        GUI_LOT_DESCRIPTION.append(lotDesc);
        GUI_LOT_BIO.textContent = selectedLotLong.description;
        GUI_LOT_BIO.style.display = "block";
    }

    // If roommate not located, write contextual lot bio
    function writeAbsentLotThumbnail(existence, selectedSimLong) {

        // Set lot image to unknown
        GUI_LOT_THUMBNAIL.src = `${RES_UNKNOWN_LOT}`;
        eggUtils.resetLotThumbnailStyles();

        // Get lot description and label
        let lotDescription = "";
        let lotLabel = "";
        switch (existence) {

            case "FLOATING":
                lotDescription = "Category: Air\nEstablished: Dawn of Time\nAdmit Mode: Admit All";
                lotLabel = "Floating";
                break;

            case "WORKING":
                lotDescription = "Category: Job\nMaking: Simoleons";
                lotLabel = `Working - ${JOB_STRINGS[selectedSimLong.current_job]}`;
                break;

            case "HIDDEN":
                lotDescription = "Hidden";
                lotLabel = "Hidden";
                break;

            case "OFFLINE":
                lotDescription = "This sim is touching grass";
                lotLabel = "Offline";
                break;

            default:
                lotDescription = "This sim is touching grass";
                lotLabel = "Offline";
                break;
        }

        // Write label and description
        writeToLabel(lotLabel, "thumbnail-title");
        GUI_LOT_DESCRIPTION.textContent = lotDescription;
    }

    // Change bookmark button styles
    function updateBookmarkButton(selID) {

        let bookSims = storageUtils.returnLocalStorage(STORAGE_BOOKMARK_KEY);
        let isBookmarked = false;

        // Find if sim bookmarked or not
        for (let i = 0; i < bookSims.simID.length; i++) {

            if (selID == bookSims.simID[i]) {

                isBookmarked = true;
                break;
            }
        }
        GUI_BOOKMARK_BUTTON.checked = isBookmarked;
    }
    //#endregion

    //#region Build sim/lot lists

    // Create element to act as a header for sim/lot lists
    function buildListHeader(columnLeftText, columnRightText) {

        let listHead = document.createElement("div");
        listHead.id = "sim-list-node";
        listHead.classList.add("sim-list-title");

        let leftHead = document.createElement("p");
        leftHead.textContent = columnLeftText;

        let rightHead = document.createElement("p");
        rightHead.textContent = columnRightText;

        listHead.append(leftHead);
        listHead.append(rightHead);

        return listHead;
    }

    // Fill sim list with sim entries
    function populateSimList(simList) {

        let simListContainer = document.getElementById('sims-table');
        simListContainer.replaceChildren();
        simListContainer.append(buildListHeader("Name", "Age"));

        for (let i = 0; i < simList.length; i++) {

            let simNode = createListNode(returnSimTitle(simList[i]), `${simUtils.returnSimAge(simList[i].date)} Days`);
            addIndexClickHandler(simNode, "sim");
            simListContainer.append(simNode);

            // If Reagan, add easter egg
            if (simList[i].name == CUSTOM_STYLE_REAGAN) simNode.children[0].classList.add("rainbow-text");
        }
    }

    // Fill lot list with lot entries
    function populateLotList(lotList) {

        let lotListContainer = document.getElementById('lots-table');
        lotListContainer.replaceChildren();
        lotListContainer.append(buildListHeader("Name", "Population"));
        
        for (i = 0; i < lotList.length; i++) {
        
            let lotNode = createListNode(returnLotTitle(lotList[i]), lotList[i].avatars_in_lot + " sims");
            addIndexClickHandler(lotNode, "lot");
            lotListContainer.append(lotNode);
        }
    }

    // Write list of sims in selected lot
    async function writeSimsInLot(selectedLot, population) {

        // Show sims in lot
        GUI_SIMS_IN_LOT.style.display = "flex";
        GUI_SIMS_IN_LOT_LABEL.textContent = `Sims In Lot: ${population}`;

        // Reset lists
        GUI_SIMS_IN_LOT_SIMS.innerHTML = "";
        GUI_SIMS_IN_LOT_ROOMMATES.innerHTML = "";

        // Build list for sims at lot
        let simListHeader = buildListHeader("Sims", "");
        simListHeader.id = "sim-in-lot-list-node";
        GUI_SIMS_IN_LOT_SIMS.append(simListHeader);

        let allCount = 0;   // Known sims at lot
        let knownCount = 0; // Excludes roommates

        // For sims online
        for (let i = 0; i < simDataHolder.simShortList.avatars.length; i++) {

            // If sim is a roommate, save for later
            let simID = simDataHolder.simShortList.avatars[i].avatar_id;
            if (selectedLot.roommates.includes(simID)) continue;

            // If sim at lot and not roommate
            if (simDataHolder.simShortList.avatars[i].location == selectedLot.location) {

                let simName = simDataHolder.simShortList.avatars[i].name;
                let simNode = createListNode(simName, "");
                simNode.id = "sim-in-lot-list-node";
                addIndexClickHandler(simNode, "sim-in-lot");
                GUI_SIMS_IN_LOT_SIMS.append(simNode);
                
                // If Reagan, add easter egg
                if (simName == CUSTOM_STYLE_REAGAN) simNode.children[0].classList.add("rainbow-text");

                allCount++;
                knownCount++;
            }
        }

        // If townhall, get mayor instead of owner
        let mayor;
        let isTownHall = (selectedLot.category == 11);
        let townhallObj;
        if (isTownHall) {

            // Get townhall object
            townhallObj = await apiUtils.getAPIData(`${BASE_URL}/userapi/neighborhoods/${selectedLot.neighborhood_id}`);

            // Get mayor
            if (townhallObj.mayor_id != null) {

                let avatarLong = await apiUtils.getAPIData(`${BASE_URL}/userapi/avatars?ids=${townhallObj.mayor_id}`);
                mayor = avatarLong.avatars[0];
            }
            else mayor = {
                name: "The Llama",
                location: "Yo mama's house",
                privacy_mode: 69
            }
        }

        // If roommates have not been fetched from API, fetch roommate long data
        if (!("roommateLong" in selectedLot)) selectedLot.roommateLong = await apiUtils.getAPIData(apiUtils.buildRoommateLink(selectedLot));
        if (!("roommateShort" in selectedLot)) selectedLot.roommatesShort = new Array();
        
        // Get roommates and existence states
        if (!("error" in selectedLot.roommateLong)) {

            for (let i = 0; i < selectedLot.roommateLong.avatars.length; i++) {

                // Find online presence of sim
                let roomieShort = simUtils.returnShortSimFromLong(selectedLot.roommateLong.avatars[i]);
                selectedLot.roommatesShort.push(roomieShort);
    
                // Get roommates existence state
                selectedLot.roommateLong.avatars[i].existenceState = simUtils.returnExistenceState(roomieShort);

                if (roomieShort.location == selectedLot.location) allCount++;
            }
        }
        
        // Decide if should write (Maybe) on hidden sims
        let writeHidden = (allCount != population);

        // Check if owner data has been fetched from API, if not, fetch from API
        if (!("ownerLong" in selectedLot)) selectedLot.ownerLong = (isTownHall) ? mayor : simUtils.returnOwnerFromRoommateList(selectedLot.roommateLong, selectedLot.owner_id);
        if (!("ownerShort" in selectedLot)) selectedLot.ownerShort = simUtils.returnShortSimFromLong(selectedLot.ownerLong);
        selectedLot.ownerLong.existenceState = simUtils.returnExistenceState(selectedLot.ownerShort);

        // Add owner header to roommate list
        let ownerHeader = buildListHeader((isTownHall) ? "Mayor": "Owner", "");
        ownerHeader.id = "sim-in-lot-list-node";
        GUI_SIMS_IN_LOT_ROOMMATES.append(ownerHeader);

        // Add node for owner sim
        let ownerNode = createListNode(selectedLot.ownerLong.name, "");
        ownerNode.id = "sim-in-lot-list-node";

        // Conditionals for owner
        if (selectedLot.ownerLong.existenceState == "OFFLINE") ownerNode.classList.add("sim-list-node-offline");
        else if (selectedLot.ownerLong.existenceState == "LANDED_HIDDEN" && writeHidden) ownerNode.children[0].textContent += " (Maybe Hosting)";
        else if (selectedLot.ownerShort.location == selectedLot.location) ownerNode.children[0].textContent += " (Hosting)";

        // Add click handler and append to list
        if (!isTownHall || townhallObj.mayor_id != null) addIndexClickHandler(ownerNode, "sim-in-lot");
        GUI_SIMS_IN_LOT_ROOMMATES.append(ownerNode);

        // Create elements for roommates at lot text
        if (!("error" in selectedLot.roommateLong)) {

            if (selectedLot.roommateLong.avatars.length > 1) {

                // Create roommate header if roommates exist
                GUI_SIMS_IN_LOT_ROOMMATES.append(createListNode("", ""));
                let roommatesHeader = buildListHeader("Roommates", "");
                roommatesHeader.id = "sim-in-lot-list-node";
                GUI_SIMS_IN_LOT_ROOMMATES.append(roommatesHeader);
            }

            // Compile roommates
            for (let i = 0; i < selectedLot.roommateLong.avatars.length; i++) {

                // Skip owner
                if (selectedLot.roommateLong.avatars[i].avatar_id == selectedLot.ownerLong.avatar_id) continue;
                let existenceState = selectedLot.roommateLong.avatars[i].existenceState;

                // Create roommate node
                let roommateNode = createListNode(selectedLot.roommateLong.avatars[i].name, "");
                roommateNode.id = "sim-in-lot-list-node";
                addIndexClickHandler(roommateNode, "sim-in-lot");

                // Conditional existence styling
                if (existenceState == "LANDED_HIDDEN" && writeHidden) roommateNode.children[0].textContent += " (Maybe Hosting)";
                if (existenceState == "OFFLINE") roommateNode.classList.add("sim-list-node-offline");
                if (selectedLot.roommatesShort[i].location == selectedLot.location) roommateNode.children[0].textContent += " (Hosting)";

                // Append roommate node to list
                GUI_SIMS_IN_LOT_ROOMMATES.append(roommateNode);
            }
        }
        
        // Write extra text for number of hidden sims
        if (population - allCount != 0 && writeHidden) {

            // Extra space
            let extraText = ""
            if (knownCount > 0) extraText += "\n";
            
            // Handle plurals
            if (knownCount == 0) extraText += `${population - allCount}  Hidden Sim` + (((population - allCount) == 1) ? "" : "s");
            else extraText += `And ${population - allCount} More Hidden Sim` + (((population - allCount) == 1) ? "" : "s");

            // Create node and append to list
            let hiddenNode = createListNode(extraText, "");
            hiddenNode.id = "sim-list-node-static";
            GUI_SIMS_IN_LOT_SIMS.append(hiddenNode);
        }
    }

    // Populate bookmark list with sims
    function writeBookmarkSims(simList) {

        // Reset bookmark list, append header
        GUI_BOOKMARK_LIST.innerHTML = "";
        GUI_BOOKMARK_LIST.append(buildListHeader("Name", "Age"));
    
        // Set sims into online or offline lists
        let onlineSims = new Array();
        let offlineSims = new Array();
        for (let i = 0; i < simList.avatars.length; i++) {
    
            let online = false;
            for (let j = 0; j < simDataHolder.simShortList.avatars.length; j++) {
                
                let simID = simDataHolder.simShortList.avatars[j].avatar_id;
                if (simList.avatars[i].avatar_id == simID) {
    
                    onlineSims.push(simList.avatars[i]);
                    online = true;
                    break;
                }
            }
            if (!online) offlineSims.push(simList.avatars[i]);
        }

        // Append and style online sims
        for (sim of onlineSims) {
            
            let simName = returnSimTitle(sim);
            let simNode = createListNode(simName, simUtils.returnSimAge(sim.date) + " days");
            addIndexClickHandler(simNode, "bookmark");
            GUI_BOOKMARK_LIST.append(simNode);

            // If Reagan, add easter egg
            if (sim.name == CUSTOM_STYLE_REAGAN) simNode.children[0].classList.add("rainbow-text");
        }

        // Append and style offline sims
        for (sim of offlineSims) {
            
            let simName = returnSimTitle(sim);
            let simNode = createListNode(simName, simUtils.returnSimAge(sim.date) + " days");
            simNode.classList.add("sim-list-node-offline");
            addIndexClickHandler(simNode, "bookmark");
            GUI_BOOKMARK_LIST.append(simNode);
        }
    }

    // Create node for list, with 2 columns (usually "sim/lot name", "age/sims in lot")
    function createListNode(contentLeft, contentRight) {

        let listNode = document.createElement("div");
        listNode.id = "sim-list-node";

        let elementLeft = document.createElement("div");
        elementLeft.textContent = contentLeft;

        let elementRight = document.createElement("div");
        elementRight.textContent = contentRight;

        listNode.append(elementLeft);
        listNode.append(elementRight);
        return listNode;
    }

    // Add click listener for node in list
    function addIndexClickHandler(element, type) {

        if (type == "sim" || type == "bookmark") {

            element.addEventListener("click", function() {

                let index = domUtils.getIndexInParent(this);
                let simName = getSimNameFromList(this.parentElement, index);
                domUtils.resetListSelection();

                // Write sim bio
                this.classList.add("sim-list-node-selected");
                guiUtils.getIndex("sim", simName);
            });
        }
        else if (type == "lot") {

            element.addEventListener("click", function() {

                let index = domUtils.getIndexInParent(this);
                let lotName = getSimNameFromList(this.parentElement, index);
                domUtils.resetListSelection();

                // Write lot bio
                this.classList.add("sim-list-node-selected");
                guiUtils.getIndex("lot", lotName);
            });
        }
        else if (type == "sim-in-lot") {

            element.addEventListener("click", function() {

                let index = domUtils.getIndexInParent(this);
                let simName = getSimNameFromList(this.parentElement, index);
                domUtils.resetListSelection();

                // Write sim bio
                this.classList.add("sim-in-lot-list-node-selected");
                guiUtils.getIndex("sim", simName);
            });
        }
    }
    //#endregion

    return {
        writeGreaterSimContext: writeGreaterSimContext,
        buildListHeader: buildListHeader,
        populateSimList: populateSimList,
        populateLotList: populateLotList,
        writeToLabel: writeToLabel,
        getIndex: getIndex,
        updateBookmarkButton: updateBookmarkButton,
        writeSimThumbnail: writeSimThumbnail,
        writeLotThumbnail: writeLotThumbnail,
        writeBookmarkSims: writeBookmarkSims,
        writeSimsInLot: writeSimsInLot
    }
}();

filterUtils = function() {

    // Process min/max window button on click
    function minWindow(type) {

        if (type == "sim") {

            if (GUI_FILTER_SIM_ICON.classList.contains("window-minable")) {

                GUI_FILTER_SIM_ICON.classList.remove("window-minable");
                GUI_FILTER_SIM_ICON.classList.add("window-maxable");
            }
            else {

                GUI_FILTER_SIM_ICON.classList.remove("window-maxable");
                GUI_FILTER_SIM_ICON.classList.add("window-minable");
            }
            if (GUI_FILTER_SIM_ICON_ARRAY.style.display === "none") GUI_FILTER_SIM_ICON_ARRAY.style.display = "flex";
            else GUI_FILTER_SIM_ICON_ARRAY.style.display = "none";
        }
        else if (type == "lot") {

            if (GUI_FILTER_LOT_ICON.classList.contains("window-minable")) {

                GUI_FILTER_LOT_ICON.classList.remove("window-minable");
                GUI_FILTER_LOT_ICON.classList.add("window-maxable");
            }
            else {

                GUI_FILTER_LOT_ICON.classList.add("window-minable");
                GUI_FILTER_LOT_ICON.classList.remove("window-maxable");
            }
            if (GUI_FILTER_LOT_ICON_ARRAY.style.display === "none") GUI_FILTER_LOT_ICON_ARRAY.style.display = "flex";
            else GUI_FILTER_LOT_ICON_ARRAY.style.display = "none";
        }
        domUtils.sizeLists();
    }

    // Filter array and send to list
    function writeFilterToTable(type, filter) {

        if (type == "sim") {

            if (filter == "REMOVE") guiUtils.populateSimList(simDataHolder.simLongList.avatars);
            else guiUtils.populateSimList(filterUtils.returnFilterSimList(filter));
        } 
        else if(type == "lot") {

            if (filter == "REMOVE") guiUtils.populateLotList(simDataHolder.lotShortList.lots);
            else guiUtils.populateLotList(filterUtils.returnFilterLotList(filter));
        }
    }

    // Return filtered sim list from selected filter
    function returnFilterSimList(filter) {

        let longList = new Array();

        let simLongList = simDataHolder.simLongList;
        let simShortList = simDataHolder.simShortList;

        switch (filter) {

            case "JOB_DINER":
                for (i = 0; i < simLongList.avatars.length; i++) {
                    if (simLongList.avatars[i].current_job == 2) longList.push(simLongList.avatars[i]);
                }
                break;

            case "JOB_CLUB_DJ":
                for (i = 0; i < simLongList.avatars.length; i++) {
                    if (simLongList.avatars[i].current_job == 4) longList.push(simLongList.avatars[i]);
                }
                break;

            case "JOB_CLUB_DANCER":
                for (i = 0; i < simLongList.avatars.length; i++) {
                    if (simLongList.avatars[i].current_job == 5) longList.push(simLongList.avatars[i]);
                }
                break;

            case "JOB_ROBOT":
                for (i = 0; i < simLongList.avatars.length; i++) {
                    if (simLongList.avatars[i].current_job == 1) longList.push(simLongList.avatars[i]);
                }
                break;

            case "SHOWN":
                for (i = 0; i < simShortList.avatars.length; i++) {
                    if (simShortList.avatars[i].privacy_mode == 0) longList.push(simLongList.avatars[i]);
                }
                break;

            case "HIDDEN":
                for (let i = 0; i < simShortList.avatars.length; i++) {
                    
                    let existence = simUtils.returnExistenceState(simShortList.avatars[i]);
                    if (existence == "HIDDEN" || existence == "LANDED_HIDDEN") longList.push(simLongList.avatars[i]);
                }
                break;

            case "FOUND":
                for (let i = 0; i < simShortList.avatars.length; i++) {
                    let existence = simUtils.returnExistenceState(simShortList.avatars[i]);
                    if (existence == "LANDED_HIDDEN") longList.push(simLongList.avatars[i]);
                }
                break;

            case "UNFOUND":
                for (let i = 0; i < simShortList.avatars.length; i++) {

                    let isPrivate = simShortList.avatars[i].privacy_mode;
                    let existence = simUtils.returnExistenceState(simShortList.avatars[i]);
                    if (isPrivate && existence != "LANDED_HIDDEN") longList.push(simLongList.avatars[i]);
                }
                break;

            case "FLOATING":
                for (let i = 0; i < simShortList.avatars.length; i++) {
                    let existence = simUtils.returnExistenceState(simShortList.avatars[i]);
                    if (existence == "FLOATING") longList.push(simLongList.avatars[i]);
                }
                break;

            case "LANDED":
                for (let i = 0; i < simShortList.avatars.length; i++) {
                    let existence = simUtils.returnExistenceState(simShortList.avatars[i]);
                    if (existence == "LANDED") longList.push(simLongList.avatars[i]);
                }
                break;

            case "WORKING":
                for (let i = 0; i < simShortList.avatars.length; i++) {
                    let existence = simUtils.returnExistenceState(simShortList.avatars[i]);
                    if (existence == "WORKING") longList.push(simLongList.avatars[i]);
                }
                break;

            case "STAFF":
                for (let i = 0; i < simShortList.avatars.length; i++) {
                    if (simUtils.isSimStaffMember(simShortList.avatars[i].name)) longList.push(simLongList.avatars[i]);
                }
                break;

            default:
                break;
        }
        return longList;
    }

    // Return filtered lot list from selected filter
    function returnFilterLotList(filter) {

        let shortList = new Array();
        for (let i = 0; i < simDataHolder.lotShortList.lots.length; i++) {

            if (simDataHolder.lotShortList.lots[i].category == LOT_SEARCH_ID[filter]) shortList.push(simDataHolder.lotShortList.lots[i]);
        }
        return shortList;
    }

    //#region Filter Icons
    // Populate filter buttons (TODO: make less hacky, less magic variables)
    function fillButtonGraphics() {

        const lotFilterArray = document.getElementById("lot-filter-array");
        const simFilterArray = document.getElementById("sim-filter-array");
    
        for (let i = 0; i < 12; i++) {
    
            var x = (i % 4) * 71;
            var y = Math.floor(i / 4) * 71;
            let button = document.createElement("button");
            button.style.background = `url(${RES_LOT_FILTER}) ${-x}px ${-y}px`;
    
            addFilterClasses(button, "lot");
            lotFilterArray.append(button);
        }
        for (let i = 0; i < 12; i++) {
    
            var x = (i % 4) * 71;
            var y = Math.floor(i / 4) * 71;
            let button = document.createElement("button");
            button.style.background = `url(${RES_SIM_FILTER}) ${-x}px ${-y}px`;
    
            addFilterClasses(button, "sim");
            simFilterArray.append(button);
        }
    }

    // Add classes to filter buttons
    function addFilterClasses(element, type) {

        element.classList.add("filter-button");
        if (type == "sim") element.id = "sim-filter-button";
        if (type == "lot") element.id = "lot-filter-button";
    
        element.addEventListener("click", function() {
    
            filterButtonClick(this, type);
        });

        element.addEventListener("mouseover", function() {
    
            filterUtils.mouseOverFilterChange(this, "in", type);
            let tooltip = document.createElement("span");
            tooltip.classList.add("tooltip");
            
            if (type == "sim") tooltip.textContent = SIM_FILTER_TOOLTIP[Array.from(this.parentElement.children).indexOf(this)];
            if (type == "lot") tooltip.textContent = LOT_FILTER_TOOLTIP[Array.from(this.parentElement.children).indexOf(this)];
    
            this.append(tooltip);
        });

        element.addEventListener("mouseout", function(){
    
            filterUtils.mouseOverFilterChange(this, "out", type);
            this.removeChild(this.children[0]);
        });
    }

    // On mouseover filter button
    function mouseOverFilterChange(button, action, type) {

        const index = Array.from(button.parentElement.children).indexOf(button);
        var x = (index % 4) * 71;
        var y = Math.floor(index / 4) * 71;

        if (type == "lot") {
    
            if (button.classList.contains("lot-filter-active")) return;
    
            if (action == "in") {
            
                button.style.background = `url(${RES_LOT_FILTER_HOVER}) ${-x}px ${-y}px`;
            }
            else if (action == "out") {
    
                button.style.background = `url(${RES_LOT_FILTER}) ${-x}px ${-y}px`;
            }
        }
        else if (type == "sim") {
    
            if (button.classList.contains("sim-filter-active")) return;
    
            if (action == "in") {
            
                button.style.background = `url(${RES_SIM_FILTER_HOVER}) ${-x}px ${-y}px`;
            }
            else if (action == "out") {
    
                button.style.background = `url(${RES_SIM_FILTER}) ${-x}px ${-y}px`;
            }
        }
    }

    // On click filter button
    function filterButtonClick(button, type) {

        const index = Array.from(button.parentElement.children).indexOf(button);
        filterArray = button.parentElement;
    
        var count = 0;
        if (type == "lot") {
    
            var sameButton = (button.classList.contains("lot-filter-active"));
            for (let button of filterArray.children) {
    
                button.classList.remove("lot-filter-active");
                var x = (count % 4) * 71;
                var y = Math.floor(count / 4) * 71;
                button.style.background = `url(${RES_LOT_FILTER}) ${-x}px ${-y}px`;
        
                count++;
            }
            if (sameButton) {

                writeFilterToTable("lot", "REMOVE");
                simDataHolder.lotFilter = "REMOVE";
            }
            else {
                var x = (index % 4) * 71;
                var y = Math.floor(index / 4) * 71;
                button.style.background = `url(${RES_LOT_FILTER_SELECTED}) ${-x}px ${-y}px`;
                button.classList.add("lot-filter-active");
                writeFilterToTable("lot", index);
                simDataHolder.lotFilter = index;
            }
            return;
        }
        else if (type == "sim") {
    
            var sameButton = (button.classList.contains("sim-filter-active"));
            for (let button of filterArray.children) {
    
                button.classList.remove("sim-filter-active");
                var x = (count % 4) * 71;
                var y = Math.floor(count / 4) * 71;
                button.style.background = `url(${RES_SIM_FILTER}) ${-x}px ${-y}px`;

                count++;
            }
            if (sameButton) {

                writeFilterToTable("sim", "REMOVE");
                simDataHolder.simFilter = "REMOVE";
            }
            else {
    
                var x = (index % 4) * 71;
                var y = Math.floor(index / 4) * 71;
                button.style.background = `url(${RES_SIM_FILTER_SELECTED}) ${-x}px ${-y}px`;
                button.classList.add("sim-filter-active");
                writeFilterToTable("sim", SIM_FILTER_KEYS[index]);
                simDataHolder.simFilter = index;
            }
            return;
        }
    }
    //#endregion

    return {
        minWindow: minWindow,
        writeFilterToTable: writeFilterToTable,
        returnFilterSimList: returnFilterSimList,
        returnFilterLotList: returnFilterLotList,
        filterButtonClick: filterButtonClick,
        mouseOverFilterChange: mouseOverFilterChange,
        addFilterClasses: addFilterClasses,
        fillButtonGraphics: fillButtonGraphics
    }
}();

searchUtils = function() {

    // Retrieve long sim from database
    async function searchSim() {

        // Search sim's name in api
        let simName = GUI_SEARCH_SIM.value;
        if (simName == "") return;

        let simLong;
        if (!isNaN(simName)) {

            // Sim ID lookup
            simLong = await apiUtils.getAPIData(`${BASE_URL}/userapi/avatars/` + simName);

            // Alert if id doesn't exist
            if ("error" in simLong || simName < 0) {

                alert("Cannot find sim with ID \"" + simName + "\"");
                return;
            }

            // Push to cache
            apiUtils.sendSimEntityAnalytics(simLong.name, simLong.avatar_id);
            simDataHolder.offlineLongSimList.push(simLong);
        }
        else if (!simUtils.checkIfSimInLongCache(simName)) {

            // Sim name lookup
            simLong = await apiUtils.getAPIData(`${BASE_URL}/userapi/city/1/avatars/name/` + simName.replace(" ", "%20"));

            // Alert if sim doesn't exist
            if ("error" in simLong) {

                alert("Cannot find sim \"" + simName + "\"");
                return;
            }

            // Push to cache
            apiUtils.sendSimEntityAnalytics(simLong.name, simLong.avatar_id);
            simDataHolder.offlineLongSimList.push(simLong);
        }
        else simLong = simUtils.returnSimFromLongCache(simName);

        // Get searched sim data
        let simShort = simUtils.returnShortSimFromLong(simLong);
        let existence = simUtils.returnExistenceState(simShort);
        guiUtils.writeGreaterSimContext(simShort, simLong, existence);
    }

    // Retrieve long lot from database
    async function searchLot() {

        // Search lot in api
        let lotName = GUI_SEARCH_LOT.value;
        if (lotName == "") return;

        let lotLong;
        if (!simUtils.checkIfLotInLongCache(lotName)) {

            // If lot not cached, fetch from API
            lotLong = await apiUtils.getAPIData(`${BASE_URL}/userapi/city/1/lots/name/` + lotName.replace(" ", "%20"));

            // Alert if lot doesn't exist
            if ("error" in lotLong) {

                alert("Cannot find lot \"" + lotName + "\"");
                return;
            }

            // Push to cache
            apiUtils.sendLotEntityAnalytics(lotLong.name, lotLong.lot_id);
            simDataHolder.offlineLongLotList.push(lotLong);
        }
        else {

            // If cached, return from cache
            lotLong = simUtils.returnLotFromLongCache(lotName);
        }

        // Get lot data
        let lotShort = simUtils.returnShortLotFromLocation(lotLong.location);
        guiUtils.writeLotThumbnail(lotShort, lotLong, "");

        // Write sims in lot
        let lotPopulation = (("error") in lotShort) ? 0 : lotShort.avatars_in_lot;
        GUI_SIMS_IN_LOT.style.display = "flex";
        guiUtils.writeSimsInLot(lotLong, lotPopulation);
        GUI_SIM_VIEW.style.display = "none";
    }

    return {
        searchSim: searchSim,
        searchLot: searchLot
    }
}();

sidebarUtils = function() {

    // Update clock/job bar with active time/jobs
    function updateSidebar() {

        writeSimClock();
        writeActiveJobs();
    }

    // Open sidebar with css animation
    function expandSidebar() {

        // Do animation for expanding/retracting sidebar window
        if (!SIDEBAR.classList.contains("animate-sidebar")) {

            SIDEBAR.classList.remove("animate-sidebar-reverse");
            SIDEBAR_EXPAND_BUTTON.classList.remove("animate-sidebar-button-reverse");
            SIDEBAR_CONTAINER.classList.remove("animate-sidebar-holder-reverse");

            SIDEBAR_CONTAINER.classList.add("animate-sidebar-holder");
            SIDEBAR.classList.add("animate-sidebar");
            SIDEBAR_EXPAND_BUTTON.classList.add("animate-sidebar-button");

            toggleSidebarElements("show");
        }
        else {

            SIDEBAR.classList.remove("animate-sidebar");
            SIDEBAR_EXPAND_BUTTON.classList.remove("animate-sidebar-button");
            SIDEBAR_CONTAINER.classList.remove("animate-sidebar-holder");

            SIDEBAR_CONTAINER.classList.add("animate-sidebar-holder-reverse");
            SIDEBAR.classList.add("animate-sidebar-reverse");
            SIDEBAR_EXPAND_BUTTON.classList.add("animate-sidebar-button-reverse");

            toggleSidebarElements("hide");
        }
    }

    // Toggle visibility of sidebar elements when hidden/shown
    function toggleSidebarElements(visibility) {

        // Hide/show sidebar elements
        const toggleElements = document.getElementsByClassName("sidebar-hide");
        if (visibility == "hide") for (let i = 0; i < toggleElements.length; i++) toggleElements[i].style.display = "none";
        else if (visibility == "show") for (let i = 0; i < toggleElements.length; i++) toggleElements[i].style.display = "block";
    }

    // Format to sim-time and write to clock
    function writeSimClock() {

        // Animate colon
        let hasColon = SIDEBAR_CLOCK.innerText.includes(":");

        // Get sim time, format to 12 hour clock
        let simTime = simUtils.returnSimTime();
        let timeDenom = "AM";
        if (simTime[0] >= 12) {

            timeDenom = "PM";
            simTime[0] %= 12;
        }
        if (simTime[0] == 0) simTime[0] = 12;
        if (simTime[1] < 10) simTime[1] = "0" + simTime[1];

        // Write clock to element
        SIDEBAR_CLOCK.firstChild.textContent = `${simTime[0]}${((hasColon) ? " " : ":")}${simTime[1]} ${timeDenom}`;
    }

    // Display which jobs are currently active
    function writeActiveJobs() {

        // Get open jobs
        let jobsActive = simUtils.returnJobsOpen();
        SIDEBAR_JOB_FACTORY.style.background = `url(${RES_JOBS_ACTIVE}) 40px 0`;
        SIDEBAR_JOB_DINER.style.background = `url(${RES_JOBS_ACTIVE}) 40px 80px`;
        SIDEBAR_JOB_CLUB.style.background = `url(${RES_JOBS_ACTIVE}) 40px 40px`;

        // Set active jobs to active icon
        if (jobsActive.includes(1)) SIDEBAR_JOB_FACTORY.style.background = `url(${RES_JOBS_ACTIVE}) 0 0`;
        if (jobsActive.includes(2)) SIDEBAR_JOB_DINER.style.background = `url(${RES_JOBS_ACTIVE}) 0 80px`;
        if (jobsActive.includes(4)) SIDEBAR_JOB_CLUB.style.background = `url(${RES_JOBS_ACTIVE}) 0 40px`;
    }

    // Write about info in sidebar info panel 
    async function writeSidebarInfo() {

        let gitJson = await apiUtils.returnGitCommitJson();
        let date = gitJson.commit.commit.author.date.slice(0, 10);

        let infoText = `Xenophobe Finder\n${VERSION_STR}\n\nLast Update:\n${date}`;
        SIDEBAR_INFO.textContent = infoText;
    }

    return {
        expandSidebar: expandSidebar,
        writeSidebarInfo: writeSidebarInfo,
        updateSidebar: updateSidebar,
        toggleSidebarElements: toggleSidebarElements
    }
}();

simModuleUtils = function() {

    // Build and return a market-data object based on current active sims
    function returnMarketObject(simLong, simShort, lotShort) {

        let marketObject = new MarketObject(simLong, simShort, lotShort);
        return marketObject;
    }

    // Populates market watch module (currently disabled)
    function writeMarketWatch(marketObj) {

        // Market breakdown text block
        let breakdownText = `$${(marketObj.moneyPerHourJob + marketObj.moneyPerHourSMO).toLocaleString("en-US")} Generated Per Hour\n\n` + 
                            `SMO Total $/Hr: $${marketObj.moneyPerHourSMO.toLocaleString("en-US")}\n` + 
                            `${marketObj.simsSMO} Sims at ${marketObj.moneyLots.length} Money Lot${(marketObj.moneyLots.length > 1) ? "s" : ""}\n\n` +
                            `Job Total $/Hr: $${marketObj.moneyPerHourJob.toLocaleString("en-US")}\n` +
                            `${marketObj.simsWorking} Sims at ${simUtils.returnJobsOpen().length} Active Job${(simUtils.returnJobsOpen().length > 1) ? "s" : ""}\n\n` + 
                            "(Values Heavily Estimated)";
        GUI_MARKET_BREAKDOWN.textContent = breakdownText;

        // Write top 3 money lots
        let hotspotText = "Top Money Lots: \n\n";
        marketObj.moneyLots.sort(({lotMoney:a}, {lotMoney:b}) => b - a);
        for (let i = 0; i < 3 && i < marketObj.moneyLots.length; i++) {

            hotspotText += `${(i + 1)}. ${marketObj.moneyLots[i].lotObj.name}\n` + 
                           ` ~$${(marketObj.moneyLots[i].lotMoney).toLocaleString("en-US")} $/Hr\n\n`;
        }
        hotspotText = hotspotText.slice(0, -1);
        GUI_MARKET_HOTSPOTS.textContent = hotspotText;
    }

    // Write SMO percentages to module
    function writeSMOPercentages(percentageData) {

        let sortedValues = Object.keys(percentageData).sort(function(a, b){return percentageData[b] - percentageData[a]});
        for (let i = 0; i < sortedValues.length; i++) {

            smoName = sortedValues[i];
            let smoEntry = buildSMOPEntry(smoName, percentageData[smoName]);
            SMO_PERCENTAGES_DIV.appendChild(smoEntry);
        }
    }

    // Construct %-bar element and style accordingly
    function buildSMOPEntry(objectName, objectPercentage) {

        // SMO bar graphic
        let smoBar = document.createElement("div");
        smoBar.classList += "smo-bar";

        let smoBarText = document.createElement("p");
        smoBarText.classList += "smo-text";
        smoBarText.textContent = `${objectPercentage}%`;

        let smoBarGraphic = document.createElement("div");
        smoBarGraphic.classList += "smo-bar-graphic";
        smoBarGraphic.style.height = `${((objectPercentage / 15) * 100) - 15}%`;
        let barColor = findPercentageColor(objectPercentage);
        smoBarGraphic.style.backgroundColor = `hsl(${barColor[0]}, ${barColor[1]}%, ${barColor[2]}%)`;

        // SMO Name
        let smoName = document.createElement("p");
        smoName.textContent = objectName;
        smoName.classList += "smo-text";
        
        // Create array entry
        let newEntry = document.createElement("div");
        newEntry.classList += "smo-column";

        smoBar.appendChild(smoBarText);
        smoBar.appendChild(smoBarGraphic);

        newEntry.appendChild(smoBar);
        newEntry.appendChild(smoName);

        return newEntry;
    }

    // Find color of SMO % bar based on fillage
    function findPercentageColor(smoPercentage) {

        // Default colors only differ in hue, in the future this should probably be expanded for full HSL
        let hue = (((smoPercentage - 50) / 100) * (SMO_BAR_GREEN[0] - SMO_BAR_RED[0])) + SMO_BAR_RED[0];
        let color = [hue, SMO_BAR_GREEN[1], SMO_BAR_GREEN[2]];

        return color;
    }

    return {
        returnMarketObject: returnMarketObject,
        writeMarketWatch: writeMarketWatch,
        writeSMOPercentages: writeSMOPercentages
    }
}();

apiUtils = function() {

    //#region API Fetching
    // Return json of latest simfinder commit
    async function returnGitCommitJson() {

        let obj;
        const res = await fetch(RECENT_COMMIT_URL);
        obj = await res.json();

        console.log("%cFetching Last Sim Finder Commit:\n\n", "color: white; background-color: darkgreen;", RECENT_COMMIT_URL);
        
        return obj;
    }

    // Fetches staff names from defined url
    async function getDBLookupData() {

        let obj;
        const res = await fetch(STAFF_LIST_URL);
        obj = await res.json();
        console.log("%cFetching Sim Finder Lookup Data:\n\n", "color: white; background-color: darkgreen;", STAFF_LIST_URL);
        
        return obj;
    }

    // Return an object fetched from given link
    async function getAPIData (apiLink) {
        
        // Clean link
        apiLink = cleanLink(apiLink);

        let obj;
        const res = await fetch(apiLink);
        obj = await res.json();
    
        console.log("%cFetching Api Data:\n\n", "color: white; background-color: green;", apiLink);
        simDataHolder.apiStats.incrementAPICalls();

        return obj;
    }
    //#endregion

    // Clean link of any crap that might fog a url
    // TODO: this shouldn't be needed, I'm just stupid. Should fix.
    function cleanLink(linkText) {

        if (linkText.includes("(Maybe Hosting)")) linkText = linkText.replace(" (Maybe Hosting)", "");
        if (linkText.includes("🎂")) linkText = linkText.replace(" 🎂", "");
        if (linkText.includes("🔧")) linkText = linkText.replace(" 🔧", "");
        if (linkText.includes("(Hosting)")) linkText = linkText.replace(" (Hosting)", "");

        return linkText;
    }

    //#region Analytics
    // Logs sim-lookups by simname and id
    function sendSimEntityAnalytics(fetchedSimName, fetchedSimID) {

        gtag('event', 'api_sim_fetch', {
            'fetchedSimName' : fetchedSimName,
            'fetchedSimID' : fetchedSimID
        });
    }

    // Logs lot-lookups by lotname and id
    function sendLotEntityAnalytics(fetchedLotName, fetchedLotID) {

        gtag('event', 'api_lot_fetch', {
            'fetchedLotName' : fetchedLotName,
            'fetchedLotID' : fetchedLotID
        });
    }

    // Logs bookmarks by name, id, and bookmarked (yes/no)
    function sendBookmarkAnalytics(bookmarked, entityName, entityID) {

        gtag('event', 'bookmark_change', {
            'bookmarked' : bookmarked,
            'bookmarkedName' : entityName,
            'bookmarkedID' : entityID
        });
    }
    //#endregion

    //#region API url building
    // Id list to sim object (for bookmark id list)
    function buildLongSimLinkFromID(idList) {

        let simIdString = `${BASE_URL}/userapi/avatars?ids=`;
        for (i = 0; i < idList.length; i++) simIdString += idList[i] + ",";

        simIdString = simIdString.slice(0, -1);
        return simIdString;
    }

    // Builds api lookup link from list of avatar ids
    function buildLongSimLink(simList) {

        let simIdString = `${BASE_URL}/userapi/avatars?ids=`;
        for (i = 0; i < simList.avatars.length; i++) simIdString += simList.avatars[i].avatar_id + ",";
    
        simIdString = simIdString.slice(0, -1);
        return simIdString;
    }

    // Builds api lookup link from list of lot ids
    function buildLongLotLink(lotList) {

        let lotIDString = `${BASE_URL}/userapi/lots?ids=`;
        for (i = 0; i < lotList.lots.length; i++) lotIDString += lotList.lots[i].lot_id + ",";
    
        lotIDString = lotIDString.slice(0, -1);
        return lotIDString;
    }

    // Builds api link from lot's roommates
    function buildRoommateLink(longLot) {

        let roommateIDString = `${BASE_URL}/userapi/avatars?ids=`;
        for (i = 0; i < longLot.roommates.length; i++) roommateIDString += longLot.roommates[i] + ",";

        roommateIDString = roommateIDString.slice(0, -1);
        return roommateIDString;
    }
    //#endregion

    return {
        getAPIData: getAPIData,
        buildLongSimLink: buildLongSimLink,
        buildLongLotLink: buildLongLotLink,
        buildRoommateLink: buildRoommateLink,
        buildLongSimLinkFromID: buildLongSimLinkFromID,
        returnGitCommitJson: returnGitCommitJson,
        sendSimEntityAnalytics: sendSimEntityAnalytics,
        sendBookmarkAnalytics: sendBookmarkAnalytics,
        sendLotEntityAnalytics: sendLotEntityAnalytics,
        getDBLookupData: getDBLookupData,
        cleanLink: cleanLink
    }
}();

storageUtils = function() {

    // Set default user settings
    function setDefaultSettings() {

        // Check if user settings empty
        if (!checkIfSettingsEmpty()) return;
        localStorage.removeItem(SETTINGS_KEY);

        // Set default user settings
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(new UserSetting()));
    }

    // Get user settings from local storage
    function returnSettings() {

        if (checkIfSettingsEmpty()) setDefaultSettings();

        let settingObject = JSON.parse(localStorage.getItem(SETTINGS_KEY));
        return settingObject;
    }

    // Check if user settings exist in localstorage
    function checkIfSettingsEmpty() {

        return (JSON.parse(localStorage.getItem(SETTINGS_KEY) == null));
    }

    // Check if localstorage is empty
    function checkIfStorageEmpty(storageKey) {

        // If storage empty or sim ID list is empty
        return (JSON.parse(localStorage.getItem(storageKey)) == null ||
        JSON.parse(localStorage.getItem(storageKey)).simID.length == 0);
    }

    // Set default sim bookmark in localstorage
    function setDefaultStorage(storageKey) {

        // If storage is not empty, return
        if (!checkIfStorageEmpty(storageKey)) return;

        // Clear previous storage, just in case
        localStorage.removeItem(storageKey);

        // Set storage to have one sim ID
        let initStorage = { simID: [126] };
        localStorage.setItem(storageKey, JSON.stringify(initStorage));
    }

    // Remove storage key from localstorage
    function removeStorageKey(storageKey) {

        localStorage.removeItem(storageKey);
    }

    // Change the key of an item in localstorage
    function changeStorageKey(oldKey, newKey) {

        let oldStorageEmpty = checkIfStorageEmpty(oldKey);
        let newStorageEmpty = checkIfStorageEmpty(newKey);

        if (newStorageEmpty && !oldStorageEmpty) {

            // Get data from previous key
            let oldStorage = returnLocalStorage(oldKey);
            let oldStorageString = JSON.stringify(oldStorage);

            // Write old data to new key
            saveStorage(newKey, oldStorageString);

            // Remove data from old key
            removeStorageKey(oldKey);
        }
    }

    // Save key/data to localstorage
    function saveStorage(storageKey, storageString) {

        localStorage.setItem(storageKey, storageString);
    }

    // Add bookmark to localstorage list
    function addBookmark(addID) {

        // Get bookmark storage, append new bookmark
        let bookmarkStorage = returnLocalStorage(STORAGE_BOOKMARK_KEY);
        bookmarkStorage.simID.push(addID);
        
        // Save local storage
        let storageString = JSON.stringify(bookmarkStorage);
        saveStorage(STORAGE_BOOKMARK_KEY, storageString);
    }

    // Remove bookmark from localstorage list
    function deleteBookmark(deleteID) {

        // Get bookmark storage
        let bookmarkStorage = returnLocalStorage(STORAGE_BOOKMARK_KEY);

        // Remove id from bookmarks
        let index = bookmarkStorage.simID.indexOf(deleteID);
        if (index > -1) bookmarkStorage.simID.splice(index, 1);
        
        // Save local storage
        let storageString = JSON.stringify(bookmarkStorage);
        saveStorage(STORAGE_BOOKMARK_KEY, storageString);
    }

    // Get storageKey from localstorage
    function returnLocalStorage(storageKey) {

        // If storage empty, set default storage
        if (checkIfStorageEmpty(storageKey)) setDefaultStorage(storageKey);

        // Return json from local storage
        let simIDObject = JSON.parse(localStorage.getItem(storageKey));
        return simIDObject;
    }

    // Export bookmarks from localstorage
    function exportLocalStorage(storageKey) {

        let dateObj = simUtils.returnDateObjectFromUNIX(Date.now() / 1000);
        let dateString = `${dateObj.month}-${dateObj.day}-${dateObj.year}`

        let saveObject = returnLocalStorage(storageKey);
        let saveString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(saveObject));

        let downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.setAttribute("href", saveString);
        downloadAnchorNode.setAttribute("download", `SimFinder Bookmarks ${dateString}.json`);
        document.body.append(downloadAnchorNode);

        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    // Import bookmarks to localstorage
    function importLocalStorage(storageKey) {

        // Open file dialog
        let fileInput = document.createElement("input");
        fileInput.setAttribute("type", "file");
        fileInput.click();
        fileInput.onchange = e => {

            // Read chosen file
            let file = e.target.files[0];
            let reader = new FileReader();
            reader.readAsText(file, "UTF-8");
            reader.onload = readerEvent => {

                // Set to bookmark key
                let content = readerEvent.target.result;
                
                // Try converting content string to json
                let contentObject;
                try {

                    contentObject = JSON.parse(content);
                }
                catch (error) {

                    alert("The file you are importing is invalid. Reverting to previous bookmarks.");
                }

                // Check validity of imported bookmarks
                let validImport = checkImportValidity(contentObject);
                if (validImport) {

                    // Set item and reload page
                    localStorage.setItem(storageKey, content);
                    alert("Bookmarks imported, press OK to reload page.");
                    location.reload();
                }
                else alert("The file you are importing is invalid. Reverting to previous bookmarks.");
            }
        }
    }

    // Check validity of imported bookmarks list
    function checkImportValidity(importObj) {

        // Check if import has idList attribute
        if (!importObj.hasOwnProperty("simID")) return false;

        // Check if all entries in idList are integers
        for (let i = 0; i < importObj.simID.length; i++) if (!Number.isInteger(importObj.simID[i])) return false;

        // Return true if checks are passed
        return true;
    }

    // When bookmark button clicked
    async function handleBookmarkCheck() {

        // If adding bookmark
        if (GUI_BOOKMARK_BUTTON.checked) {

            // Add bookmark to list
            storageUtils.addBookmark(simDataHolder.selSimID);

            // Get data from new bookmark list, fetch in case sim was offline
            let addSim = await apiUtils.getAPIData(apiUtils.buildLongSimLinkFromID([simDataHolder.selSimID]));
            apiUtils.sendBookmarkAnalytics(true, addSim.name, addSim.avatar_id);
            simDataHolder.bookmarkList.avatars.push(addSim.avatars[0]);
        }
        // If removing bookmark
        else {

            // Remove bookmark
            storageUtils.deleteBookmark(simDataHolder.selSimID);

            // Remove sim from bookmark list
            for (let i = 0; i < simDataHolder.bookmarkList.avatars.length; i++) {

                if (simDataHolder.bookmarkList.avatars[i].avatar_id == simDataHolder.selSimID) {

                    let delSim = simDataHolder.bookmarkList.avatars[i];
                    apiUtils.sendBookmarkAnalytics(true, delSim.name, delSim.avatar_id);

                    simDataHolder.bookmarkList.avatars.splice(i, 1);
                    break;
                }
            }
        }

        // Sort sims by id, rewrite bookmark list
        simDataHolder.bookmarkList.avatars.sort(({avatar_id:a}, {avatar_id:b}) => a - b);
        guiUtils.writeBookmarkSims(simDataHolder.bookmarkList);
    }

    return {
        checkIfStorageEmpty: checkIfStorageEmpty,
        handleBookmarkCheck: handleBookmarkCheck,
        setDefaultStorage: setDefaultStorage,
        changeStorageKey: changeStorageKey,
        returnLocalStorage: returnLocalStorage,
        deleteBookmark: deleteBookmark,
        addBookmark: addBookmark,
        importLocalStorage: importLocalStorage,
        exportLocalStorage: exportLocalStorage,
        setDefaultSettings: setDefaultSettings,
        returnSettings: returnSettings,
        saveStorage: saveStorage
    }
}();
