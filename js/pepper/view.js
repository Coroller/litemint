﻿/**
 * @overview Litemint Pepper View implementation.
 * @copyright 2018-2019 Frederic Rezeau.
 * @copyright 2018-2019 Litemint LLC.
 * @license [MIT]{@link https://github.com/litemint/litemint/blob/master/LICENSE}
 */

(function (namespace) {
    "use strict";

    // Helper : Update the timer value based on elapsed.
    let view;
    let updateTimer = function (elapsed, value, factor, cb) {
        if (value > 0) {
            value -= elapsed * (factor ? factor : 1);
            if (value <= 0) {
                value = 0;
                if (cb) {
                    cb();
                }
            }
            if (view) {
                view.needRedraw = true;
            }
        }
        return value;
    };

    /**
     * UI View.
     * @class View
     * @param {Boolean} signUpMode Sign up vs Sign in mode.
     * @memberof Litemint.Pepper
     */
    namespace.Pepper.View = function (signUpMode) {
        if (!(this instanceof namespace.Pepper.View)) {
            throw new Error("ctor error");
        }
        view = this;
        namespace.Pepper.View.prototype.reset.call(this, signUpMode);
    };

    // Reset the view.
    namespace.Pepper.View.prototype.reset = function (signUpMode) {
        this.resetPinPage(signUpMode);
        this.width = 0;
        this.height = 0;
        this.unit = 0;
        this.scrollerTime = 0;
        this.scrollerEndTime = 0;
        this.modalPageTime = 0;
        this.modalPageEndTime = 0;
        this.modalPageTransitionTime = 0;
        this.modalStep = namespace.Pepper.WizardType.None;
        this.mnemonicSuccess = true;
        this.sendStep = 0;
        this.sendTransition = 0;
        this.sendFormOffset = 0;
        this.sendFormTime = 0;
        this.sendFormEndTime = 0;
        this.maxSendDigit = 11;
        this.pinMenu = [];
        this.pinMenuOffset = 0;
        this.dashboardMenu = [];
        this.dashboardMenuOffset = 0;
        this.pinErrorTime = 0;
        this.pinMsgTime = 0;
        this.pinMin = 4;
        this.pinMax = 12;
        this.numPad = [];
        this.startTime = 1;
        this.viewport = { "x": 0, "y": 0, "with": 0, "height": 0 };
        this.numPadArea = { "x": 0, "y": 0, "with": 0, "height": 0 };
        this.numPadOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        this.dashboardTime = 0;
        this.tabId = 0;
        this.amountErrorTime = 0;
        this.addressErrorTime = 0;
        this.perpetualAngle = 0;
        this.error = namespace.Pepper.ViewErrorType.None;
        this.retryTime = 0;
        this.deleteStep = 0;
    };

    // Load the view.
    namespace.Pepper.View.prototype.load = function (width, height, languageId, cb) {
        for (let i = 0; i < 11; i += 1) {
            this.numPad.push(new namespace.Pepper.HudElement(i < 9 ? i + 1 : i === 9 ? 0 : 11));
        }
        this.numPad.push(new namespace.Pepper.HudElement(12));
        for (let i = 0; i < 5; i += 1) {
            this.pinMenu.push(new namespace.Pepper.HudElement(i));
        }
        for (let i = 0; i < 4; i += 1) {
            this.dashboardMenu.push(new namespace.Pepper.HudElement(i));
        }
        this.sendBtn = new namespace.Pepper.HudElement();
        this.receiveBtn = new namespace.Pepper.HudElement();
        this.tradeBtn = new namespace.Pepper.HudElement();
        this.menuMarker = new namespace.Pepper.HudElement();
        this.transactionsBtn = new namespace.Pepper.HudElement();
        this.assetsBtn = new namespace.Pepper.HudElement();
        this.moreBtn = new namespace.Pepper.HudElement();
        this.chartBtn = new namespace.Pepper.HudElement();
        this.pinBtn = new namespace.Pepper.HudElement();
        this.pinCodeBtn = new namespace.Pepper.HudElement();
        this.pinMenuBtn = new namespace.Pepper.HudElement();
        this.pinSwitchBtn = new namespace.Pepper.HudElement();
        this.pinMenuPanel = new namespace.Pepper.HudElement();
        this.dashboardMenuPanel = new namespace.Pepper.HudElement();
        this.carouselItem = new namespace.Pepper.HudElement();
        this.modalPageBtn = new namespace.Pepper.HudElement();
        this.modalAddAssetBtn = new namespace.Pepper.HudElement();
        this.menuBtn = new namespace.Pepper.HudElement();
        this.filterBtn = new namespace.Pepper.HudElement();
        this.numPadSendBtn = new namespace.Pepper.HudElement();
        this.numPadCloseBtn = new namespace.Pepper.HudElement();
        this.bookBtn = new namespace.Pepper.HudElement();
        this.pasteBtn = new namespace.Pepper.HudElement();
        this.addAssetBtn = new namespace.Pepper.HudElement();
        this.qrBtn = new namespace.Pepper.HudElement();
        this.accountBtn = new namespace.Pepper.HudElement();
        this.assetPicker = new namespace.Pepper.HudElement();
        this.closeScrollerBtn = new namespace.Pepper.HudElement();
        this.closeModalBtn = new namespace.Pepper.HudElement();
        this.modalQrBtn = new namespace.Pepper.HudElement();
        this.modalPasswordBtn = new namespace.Pepper.HudElement();
        this.scroller = namespace.Pepper.createScrollElement();
        this.carousel = namespace.Pepper.createScrollElement();
        this.carousel.oldActive = 0;
        this.list = namespace.Pepper.createScrollElement();
        this.resize(width, height);
        this.setupLanguage(languageId, cb);
    };

    // Resize the view.
    namespace.Pepper.View.prototype.resize = function (width, height) {
        let landscape = false;
        let w = width;
        this.width = width;
        this.height = Math.max(height, width * 1.25);
        this.viewport.x = landscape ? this.width / 2 - w / 2 : 0;
        this.viewport.y = namespace.Pepper.barHeight;
        this.viewport.width = w;
        this.viewport.height = height - namespace.Pepper.barHeight;
        this.unit = this.viewport.width * 0.1;
        this.baseFontSize = Math.round(this.unit * 0.52);
        this.needDomUpdate = true;
        this.setActiveCarouselItem(this.carousel.active, true);
    };

    // Set the view language.
    namespace.Pepper.View.prototype.setupLanguage = function (languageId, cb) {
        let data = namespace.Pepper.loadWalletData();
        namespace.Pepper.Resources.localeText = namespace.Pepper.Resources.languagePacks[languageId].text.slice();
        namespace.Pepper.Resources.languageId = languageId;
        namespace.Pepper.Resources.languageScale = namespace.Pepper.Resources.languagePacks[languageId].scale || 1;
        // Default language (en) is used to fill missing entries.
        const defaultLanguage = namespace.Pepper.Resources.languagePacks[namespace.Pepper.Resources.defaultLanguage].text.slice();
        for (let i = 0; i < defaultLanguage.length; i += 1) {
            if (!namespace.Pepper.Resources.localeText[i]) {
                namespace.Pepper.Resources.localeText[i] = defaultLanguage[i];
            }
        }
        data.languageId = languageId;
        namespace.Pepper.saveWalletData(data);
        if (cb) {
            setTimeout(() => {
                cb();
            }, 500);
        }
    };

    // Update the view.
    namespace.Pepper.View.prototype.update = function (elapsed) {
        this.dashboardTime = updateTimer(elapsed, this.dashboardTime, 1.2);
        this.startTime = updateTimer(elapsed, this.startTime);
        this.scrollerTime = updateTimer(elapsed, this.scrollerTime, 1.2);
        this.modalPageTime = updateTimer(elapsed, this.modalPageTime, 1.2);
        this.retryTime = updateTimer(elapsed, this.retryTime, 0.2);
        this.scrollerEndTime = 
            updateTimer(elapsed, this.scrollerEndTime, 1,
            () => {
                this.showScroller = false;
                if (this.scroller.type === namespace.Pepper.ScrollerType.Addresses) {
                    $("#address-form").fadeIn();
                }
            });
        this.modalPageEndTime = 
            updateTimer(elapsed, this.modalPageEndTime, 1,
            () => {
                this.showModalPage = false;
            });

        if (this.showScroller) {
            this.updateScroller(elapsed);
        }

        if (this.showModalPage) {
            this.updateModalPage(elapsed);
        }

        switch (this.page) {
            case namespace.Pepper.PageType.SignUp:
            case namespace.Pepper.PageType.SignIn:
                this.updatePinPage(elapsed);
                break;
            case namespace.Pepper.PageType.Dashboard:
                this.updateDashboard(elapsed);
                break;
        }

        if (this.error === namespace.Pepper.ViewErrorType.AccountNotAvailable) {
            this.retryTime = 1;
        }

        this.perpetualAngle = (this.perpetualAngle + Math.PI * 3 * elapsed) % (Math.PI * 2);
    };

    // Update the modal page.
    namespace.Pepper.View.prototype.updateModalPage = function (elapsed) {
        this.needRedraw |= this.modalPageBtn.update(elapsed);
        this.needRedraw |= this.modalAddAssetBtn.update(elapsed);
        this.needRedraw |= this.closeModalBtn.update(elapsed);
        this.needRedraw |= this.modalQrBtn.update(elapsed);
        this.needRedraw |= this.modalPasswordBtn.update(elapsed);

        this.modalPageBtn.width = this.viewport.width - this.unit;
        this.modalPageBtn.height = this.unit * 1.1;
        this.modalPageBtn.tx = this.viewport.x + this.unit * 0.5;
        this.modalPageBtn.ty = this.viewport.y + this.viewport.height - this.modalPageBtn.height * 1.3;
        if (this.modalPageBtn.spawned) {
            this.modalPageBtn.x = this.modalPageBtn.tx;
            this.modalPageBtn.y = this.modalPageBtn.ty;
            this.modalPageBtn.spawned = false;
            this.modalPageBtn.speed = 10;
        }

        this.modalAddAssetBtn.width = this.unit * 2.6;
        this.modalAddAssetBtn.height = this.unit * 0.8;
        this.modalAddAssetBtn.tx = this.viewport.x + this.unit * 2.5;
        this.modalAddAssetBtn.ty = this.viewport.y + this.unit * 1.45;
        this.modalAddAssetBtn.x = this.modalAddAssetBtn.tx;
        this.modalAddAssetBtn.y = this.modalAddAssetBtn.ty;
        this.modalAddAssetBtn.spawned = false;

        this.closeModalBtn.width = this.unit * 1.2;
        this.closeModalBtn.height = this.unit * 1.2;
        this.closeModalBtn.speed = 7;
        if (this.modalStep === namespace.Pepper.WizardType.ImportAccount) {
            this.closeModalBtn.tx = this.viewport.x + this.viewport.width - this.closeModalBtn.width;
            this.closeModalBtn.ty = this.viewport.y + this.unit * 0.2;
        }
        else {
            this.closeModalBtn.tx = this.viewport.x + this.viewport.width * 2;
            this.closeModalBtn.ty = this.viewport.y + this.unit * 0.2;
        }
        if (this.closeModalBtn.spawned) {
            this.closeModalBtn.x = this.closeModalBtn.tx;
            this.closeModalBtn.y = this.closeModalBtn.ty;
            this.closeModalBtn.spawned = false;
        }

        this.modalQrBtn.width = this.unit * 1.2;
        this.modalQrBtn.height = this.unit * 1.2;
        this.modalQrBtn.speed = 7;
        if (this.modalStep === namespace.Pepper.WizardType.ImportAccount) {
            this.modalQrBtn.tx = this.viewport.x + this.unit * 0.5;
            this.modalQrBtn.ty = this.viewport.y + this.unit * 5;
        }
        else {
            this.modalQrBtn.tx = this.viewport.x - this.viewport.width;
            this.modalQrBtn.ty = this.viewport.y + this.unit * 5;
        }
        if (this.modalQrBtn.spawned) {
            this.modalQrBtn.x = this.modalQrBtn.tx;
            this.modalQrBtn.y = this.modalQrBtn.ty;
            this.modalQrBtn.spawned = false;
        }

        this.modalPasswordBtn.width = this.unit * 1.2;
        this.modalPasswordBtn.height = this.unit * 1.2;
        this.modalPasswordBtn.speed = 7;
        if (this.modalStep === namespace.Pepper.WizardType.ImportAccount) {
            this.modalPasswordBtn.tx = this.viewport.x + this.viewport.width - this.modalPasswordBtn.width * 1.5;
            this.modalPasswordBtn.ty = this.viewport.y + this.unit * 5;
        }
        else {
            this.modalPasswordBtn.tx = this.viewport.x + this.viewport.width * 2;
            this.modalPasswordBtn.ty = this.viewport.y + this.unit * 5;
        }
        if (this.modalPasswordBtn.spawned) {
            this.modalPasswordBtn.x = this.modalPasswordBtn.tx;
            this.modalPasswordBtn.y = this.modalPasswordBtn.ty;
            this.modalPasswordBtn.spawned = false;
        }

        this.modalPageTransitionTime = updateTimer(elapsed, this.modalPageTransitionTime);
    };

    // Update the scroller.
    namespace.Pepper.View.prototype.updateScroller = function (elapsed) {
        this.scroller.headerHeight = this.unit * 1.5;
        this.scroller.rowHeight = this.unit * 1.3;

        switch (this.scroller.type) {
            case namespace.Pepper.ScrollerType.AddAsset:
                this.scroller.rowHeight = this.unit * 1.8;
                this.scroller.x = this.viewport.x;
                this.scroller.y = this.viewport.y + this.scroller.headerHeight;
                this.scroller.width = this.viewport.width;
                this.scroller.height = this.viewport.height - this.scroller.headerHeight;
                break;
            case namespace.Pepper.ScrollerType.FilterMenu:
                this.scroller.headerHeight = this.unit * 7.2;
                this.scroller.x = this.viewport.x + this.viewport.width * 0.3;
                this.scroller.y = this.viewport.y + this.scroller.headerHeight;
                this.scroller.width = this.viewport.width * 0.7 - this.unit * 0.2;
                this.scroller.height = this.viewport.height - this.scroller.headerHeight;
                this.scroller.translatePoint = { "x": this.filterBtn.x + this.filterBtn.width, "y": this.filterBtn.y };
                break;
            case namespace.Pepper.ScrollerType.AssetsMenu:
                this.scroller.headerHeight = this.unit * 1.7;
                this.scroller.x = this.viewport.x + this.viewport.width * 0.3;
                this.scroller.y = this.viewport.y + this.scroller.headerHeight;
                this.scroller.width = this.viewport.width * 0.7 - this.unit * 0.8;
                this.scroller.height = this.viewport.height - this.scroller.headerHeight;
                this.scroller.translatePoint = { "x": this.moreBtn.x + this.moreBtn.width, "y": this.moreBtn.y };
                break;
            case namespace.Pepper.ScrollerType.AccountSettings:
                this.scroller.headerHeight = this.unit * 2.7;
                this.scroller.x = this.viewport.x;
                this.scroller.y = this.viewport.y + this.scroller.headerHeight;
                this.scroller.width = this.viewport.width;
                this.scroller.height = this.viewport.height - this.scroller.headerHeight;
                break;
            default:
                this.scroller.x = this.viewport.x;
                this.scroller.y = this.viewport.y + this.scroller.headerHeight;
                this.scroller.width = this.viewport.width;
                this.scroller.height = this.viewport.height - this.scroller.headerHeight;
                break;
        }

        if (!this.scroller.isDown) {
            this.scroller.scrollTime = updateTimer(elapsed, this.scroller.scrollTime, 2);
        }

        let x = this.scroller.x;
        let y = this.scroller.y;
        this.scroller.minOffset = 0;
        this.scroller.maxOffset = 0;
        this.scroller.maxOffset = this.scroller.y - (this.scroller.headerHeight + namespace.Pepper.barHeight);

        for (let i = 0; i < this.scroller.items.length; i += 1) {
            const item = this.scroller.items[i];
            item.x = x;
            item.y = y;
            item.width = this.scroller.width;
            item.height = this.scroller.rowHeight;
            this.scroller.maxOffset += item.height;
            y += item.height;

            if (item.time) {
                item.time = updateTimer(elapsed, item.time, 1.2);
            }
        }

        this.scroller.hasBar = false;
        if (this.scroller.maxOffset > this.scroller.height) {
            this.scroller.hasBar = true;
            this.scroller.barSize = this.scroller.height * this.scroller.height / this.scroller.maxOffset;
        }
        else {
            this.scroller.offset = 0;
        }

        this.scroller.maxOffset -= this.scroller.height;
        if (this.scroller.maxOffset > 0) {
            if (!this.scroller.isDown) {
                if (this.scroller.wasDown) {
                    this.scroller.wasDown = false;
                }
                if (this.scroller.downDistance !== 0) {
                    const threshold = 0.3;
                    const velocity = Math.max(0, threshold - this.scroller.downTime) * 1.5;
                    if (velocity) {
                        this.scroller.offset += this.scroller.downDistance * velocity;
                        this.scroller.downTime += elapsed * 0.15;

                        if (this.scroller.offset < this.scroller.minOffset - this.scroller.rowHeight * 1.3) {
                            this.scroller.offset = this.scroller.minOffset - this.scroller.rowHeight * 1.3;
                            this.scroller.downTime = threshold;
                        }
                        else if (this.scroller.offset > this.scroller.maxOffset + this.scroller.rowHeight * 1.3) {
                            this.scroller.offset = this.scroller.maxOffset + this.scroller.rowHeight * 1.3;
                            this.scroller.downTime = threshold;
                        }
                        this.needRedraw = true;
                    }

                    if (this.scroller.downTime >= threshold) {
                        this.scroller.downDistance = 0;
                    }
                }
            }

            if (!this.scroller.isDown) {
                if (this.scroller.offset < this.scroller.minOffset) {
                    this.scroller.offset += this.scroller.rowHeight * elapsed * 13;
                    if (this.scroller.offset > this.scroller.minOffset) {
                        this.scroller.offset = this.scroller.minOffset;
                    }
                    this.needRedraw = true;
                }
                else if (this.scroller.offset > this.scroller.maxOffset) {
                    this.scroller.offset -= this.scroller.rowHeight * elapsed * 13;
                    if (this.scroller.offset < this.scroller.maxOffset) {
                        this.scroller.offset = this.scroller.maxOffset;
                    }
                    this.needRedraw = true;
                }
            }
            else {
                this.scroller.wasDown = true;
                this.scroller.downTime += elapsed;
                if (this.scroller.offset < this.scroller.minOffset - this.scroller.rowHeight * 1.3) {
                    this.scroller.offset = this.scroller.minOffset - this.scroller.rowHeight * 1.3;
                }
                else if (this.scroller.offset > this.scroller.maxOffset + this.scroller.rowHeight * 1.3) {
                    this.scroller.offset = this.scroller.maxOffset + this.scroller.rowHeight * 1.3;
                }
            }
        }
    };

    // Update the pin page.
    namespace.Pepper.View.prototype.updatePinPage = function (elapsed) {
        this.updateNumPad(elapsed);

        this.needRedraw |= this.pinBtn.update(elapsed);
        this.needRedraw |= this.pinSwitchBtn.update(elapsed);
        this.needRedraw |= this.pinMenuBtn.update(elapsed);
        this.needRedraw |= this.pinMenuPanel.update(elapsed);
        this.needRedraw |= this.pinCodeBtn.update(elapsed);

        this.pinBtn.width = this.numPadArea.width;
        this.pinBtn.height = this.unit * 1.3;
        this.pinBtn.x = this.numPadArea.x;
        this.pinBtn.y = this.numPadArea.y + this.numPadArea.height + this.unit * 0.1;
        this.pinBtn.tx = this.pinBtn.x;
        this.pinBtn.ty = this.pinBtn.y;
        this.pinBtn.spawned = false;
        this.pinBtn.rotationSpeed = Math.PI * 3;

        this.pinSwitchBtn.width = this.unit * 1.2;
        this.pinSwitchBtn.height = this.unit * 1.2;
        this.pinSwitchBtn.tx = this.viewport.x;
        this.pinSwitchBtn.ty = this.viewport.y - (this.hasPinSwitchBtn ? 0 : this.pinSwitchBtn.width * 2);
        if (this.pinSwitchBtn.spawned) {
            this.pinSwitchBtn.x = this.pinSwitchBtn.tx - this.pinSwitchBtn.width;
            this.pinSwitchBtn.y = this.pinSwitchBtn.ty;
            this.pinSwitchBtn.speed = 3;
            this.pinSwitchBtn.spawned = false;
        }
        else if (!this.startTime) {
            this.pinSwitchBtn.x = this.pinSwitchBtn.tx;
            this.pinSwitchBtn.y = this.pinSwitchBtn.ty;
        }

        this.pinMenuBtn.width = this.unit * 1.2;
        this.pinMenuBtn.height = this.unit * 1.2;
        this.pinMenuBtn.tx = this.viewport.x + this.viewport.width - this.pinMenuBtn.width;
        this.pinMenuBtn.ty = this.viewport.y;
        if (this.pinMenuBtn.spawned) {
            this.pinMenuBtn.x = this.pinMenuBtn.tx + this.pinMenuBtn.width;
            this.pinMenuBtn.y = this.pinMenuBtn.ty;
            this.pinMenuBtn.speed = 5;
            this.pinMenuBtn.spawned = false;
        }
        else if (!this.startTime) {
            this.pinMenuBtn.x = this.pinMenuBtn.tx;
            this.pinMenuBtn.y = this.pinMenuBtn.ty;
        }

        this.pinMenuPanel.width = this.width;
        this.pinMenuPanel.height = this.viewport.height;
        this.pinMenuPanel.tx = this.viewport.x - this.width + this.pinMenuOffset * this.viewport.width * 0.77;
        this.pinMenuPanel.ty = this.viewport.y;
        if (this.pinMenuPanel.spawned) {
            this.pinMenuPanel.x = this.pinMenuPanel.tx;
            this.pinMenuPanel.y = this.pinMenuPanel.ty;
            this.pinMenuPanel.speed = 11;
            this.pinMenuPanel.spawned = false;
        }

        this.pinCodeBtn.width = this.numPadArea.width;
        this.pinCodeBtn.height = this.unit * 1.5;
        this.pinCodeBtn.tx = this.numPadArea.x;
        this.pinCodeBtn.ty = this.numPadArea.y - this.unit * 0.1 - this.unit * 1.9 - (this.pinError || this.page === namespace.Pepper.PageType.SignUp ? this.unit * 0.9 : 0);
        if (this.pinCodeBtn.spawned) {
            this.pinCodeBtn.x = this.pinCodeBtn.tx;
            this.pinCodeBtn.y = this.pinCodeBtn.ty;
            this.pinCodeBtn.speed = 10;
            this.pinCodeBtn.spawned = false;
        }

        this.pinErrorTime = updateTimer(elapsed, this.pinErrorTime);
        this.pinMsgTime = updateTimer(elapsed, this.pinMsgTime);

        let y = this.pinMenuPanel.y + this.unit * 2.4;
        let x = this.pinMenuPanel.x + this.pinMenuPanel.width - this.viewport.width * 0.8;
        for (let i = 0; i < this.pinMenu.length; i += 1) {
            let element = this.pinMenu[i];
            this.needRedraw |=element.update(elapsed);
            element.width = this.viewport.width * 0.8;
            element.height = this.unit * 1.4;
            element.tx = x;
            element.ty = y;
            element.x = element.tx;
            element.y = element.ty;
            y += element.height;
            element.spawned = false;
        }

        if (this.isPinMenu) {
            if (this.pinMenuOffset < 1) {
                this.pinMenuOffset += elapsed * 4.5;
                if (this.pinMenuOffset > 1) {
                    this.pinMenuOffset = 1;
                }
                this.needRedraw = true;
            }
        }
        else {
            if (this.pinMenuOffset > 0) {
                this.pinMenuOffset -= elapsed * 4.5;
                if (this.pinMenuOffset < 0) {
                    this.pinMenuOffset = 0;
                }
                this.needRedraw = true;
            }
        }
    };

    // Update the dashboard.
    namespace.Pepper.View.prototype.updateDashboard = function (elapsed) {
        this.updateCarousel(elapsed);
        this.updateTabs(elapsed);
        this.updateList(elapsed);

        this.needRedraw |= this.menuBtn.update(elapsed);
        this.needRedraw |= this.accountBtn.update(elapsed);
        this.needRedraw |= this.dashboardMenuPanel.update(elapsed);
        this.needRedraw |= this.closeScrollerBtn.update(elapsed);

        this.closeScrollerBtn.width = this.unit * 1.2;
        this.closeScrollerBtn.height = this.unit * 1.2;
        this.closeScrollerBtn.speed = 7;
        if (this.showScroller && !this.scrollerEndTime && this.scroller.type === namespace.Pepper.ScrollerType.AddAsset) {
            this.closeScrollerBtn.tx = this.viewport.x + this.viewport.width - this.closeScrollerBtn.width;
            this.closeScrollerBtn.ty = this.viewport.y;
        }
        else {
            this.closeScrollerBtn.tx = this.viewport.x + this.viewport.width - this.closeScrollerBtn.width;
            this.closeScrollerBtn.ty = this.viewport.y - this.closeScrollerBtn.height * 3;
        }
        if (this.closeScrollerBtn.spawned) {
            this.closeScrollerBtn.x = this.closeScrollerBtn.tx;
            this.closeScrollerBtn.y = this.closeScrollerBtn.ty;
            this.closeScrollerBtn.spawned = false;
        }

        if (this.isSendMode) {
            this.updateNumPad(elapsed);
        }

        this.sendFormTime = updateTimer(elapsed * 2.5, this.sendFormTime);
        this.sendFormEndTime = updateTimer(elapsed * 2.5, this.sendFormEndTime);
        this.sendTransition = updateTimer(elapsed, this.sendTransition);
        this.amountErrorTime = updateTimer(elapsed, this.amountErrorTime);
        this.addressErrorTime = updateTimer(elapsed, this.addressErrorTime);

        this.menuBtn.width = this.unit * 1.2;
        this.menuBtn.height = this.unit * 1.2;
        this.menuBtn.tx = this.viewport.x + this.viewport.width - this.menuBtn.width;
        this.menuBtn.ty = this.viewport.y;
        this.menuBtn.x = this.menuBtn.tx;
        this.menuBtn.y = this.menuBtn.ty;
        this.menuBtn.spawned = false;

        this.accountBtn.width = this.unit * 1.2;
        this.accountBtn.height = this.unit * 1.2;
        this.accountBtn.tx = this.viewport.x;
        this.accountBtn.ty = this.viewport.y;
        this.accountBtn.x = this.accountBtn.tx;
        this.accountBtn.y = this.accountBtn.ty;
        this.accountBtn.spawned = false;

        this.dashboardMenuPanel.width = this.width;
        this.dashboardMenuPanel.height = this.viewport.height;
        this.dashboardMenuPanel.tx = this.viewport.x - this.width + this.dashboardMenuOffset * this.viewport.width * 0.77;
        this.dashboardMenuPanel.ty = this.viewport.y;
        if (this.dashboardMenuPanel.spawned) {
            this.dashboardMenuPanel.x = this.dashboardMenuPanel.tx;
            this.dashboardMenuPanel.y = this.dashboardMenuPanel.ty;
            this.dashboardMenuPanel.speed = 11;
            this.dashboardMenuPanel.spawned = false;
        }

        let y = this.dashboardMenuPanel.y + this.unit * 2.4;
        let x = this.dashboardMenuPanel.x + this.dashboardMenuPanel.width - this.viewport.width * 0.8;
        for (let i = 0; i < this.dashboardMenu.length; i += 1) {
            let element = this.dashboardMenu[i];
            this.needRedraw |=element.update(elapsed);
            element.width = this.viewport.width * 0.8;
            element.height = this.unit * 1.4;
            element.tx = x;
            element.ty = y;
            element.x = element.tx;
            element.y = element.ty;
            y += element.height;
            element.spawned = false;
        }

        if (this.isDashboardMenu) {
            if (this.dashboardMenuOffset < 1) {
                this.dashboardMenuOffset += elapsed * 4.5;
                if (this.dashboardMenuOffset > 1) {
                    this.dashboardMenuOffset = 1;
                }
                this.needRedraw = true;
            }
        }
        else {
            if (this.dashboardMenuOffset > 0) {
                this.dashboardMenuOffset -= elapsed * 4.5;
                if (this.dashboardMenuOffset < 0) {
                    this.dashboardMenuOffset = 0;
                }
                this.needRedraw = true;
            }
        }
    };

    // Update the carousel.
    namespace.Pepper.View.prototype.updateCarousel = function (elapsed) {
        this.needRedraw |= this.carouselItem.update(elapsed);
        this.needRedraw |= this.moreBtn.update(elapsed);
        this.needRedraw |= this.chartBtn.update(elapsed);
        this.needRedraw |= this.sendBtn.update(elapsed);
        this.needRedraw |= this.receiveBtn.update(elapsed);
        this.needRedraw |= this.tradeBtn.update(elapsed);
        this.needRedraw |= this.assetPicker.update(elapsed);

        this.carousel.headerHeight = this.unit * 1.5;
        this.carousel.colWidth = this.viewport.width * 0.9;
        this.carousel.x = this.viewport.x;
        this.carousel.y = this.viewport.y + this.carousel.headerHeight;
        this.carousel.width = this.viewport.width;
        this.carousel.height = this.unit * 5;

        this.assetPicker.width = this.unit * 4.5;
        this.assetPicker.height = this.unit * 1.2;
        this.assetPicker.tx = this.viewport.x + this.viewport.width * 0.5 - this.assetPicker.width * 0.5;
        this.assetPicker.ty = this.viewport.y + this.unit * 0.2;
        this.assetPicker.x = this.assetPicker.tx;
        this.assetPicker.y = this.assetPicker.ty;
        this.assetPicker.spawned = false;

        this.sendBtn.width = this.unit * 1.2;
        this.sendBtn.height = this.unit * 1.2;
        this.sendBtn.tx = this.carousel.x + this.unit * 1;
        this.sendBtn.ty = this.viewport.y + this.viewport.height - this.sendBtn.height - this.unit * 0.5;
        this.sendBtn.x = this.sendBtn.tx;
        this.sendBtn.y = this.sendBtn.ty;
        this.sendBtn.spawned = false;

        this.receiveBtn.width = this.unit * 1.2;
        this.receiveBtn.height = this.unit * 1.2;
        this.receiveBtn.tx = this.carousel.x + this.carousel.width * 0.5 - this.receiveBtn.width * 0.5;
        this.receiveBtn.ty = this.viewport.y + this.viewport.height - this.receiveBtn.height - this.unit * 0.5;
        this.receiveBtn.x = this.receiveBtn.tx;
        this.receiveBtn.y = this.receiveBtn.ty;
        this.receiveBtn.spawned = false;

        this.tradeBtn.width = this.unit * 1.2;
        this.tradeBtn.height = this.unit * 1.2;
        this.tradeBtn.tx = this.carousel.x + this.carousel.width - (this.unit * 1 + this.tradeBtn.width);
        this.tradeBtn.ty = this.viewport.y + this.viewport.height - this.tradeBtn.height - this.unit * 0.5;
        this.tradeBtn.x = this.tradeBtn.tx;
        this.tradeBtn.y = this.tradeBtn.ty;
        this.tradeBtn.spawned = false;

        this.chartBtn.width = this.unit;
        this.chartBtn.height = this.unit;
        this.chartBtn.x = this.carousel.x + this.unit * 0.7;
        this.chartBtn.y = this.carousel.y + this.carousel.height - (this.chartBtn.height + this.unit * 0.1);
        this.chartBtn.tx = this.chartBtn.x;
        this.chartBtn.ty = this.chartBtn.y;
        this.chartBtn.spawned = false;

        this.moreBtn.width = this.unit;
        this.moreBtn.height = this.unit;
        this.moreBtn.x = this.carousel.x + this.carousel.width - (this.moreBtn.width + this.unit * 0.7);
        this.moreBtn.y = this.carousel.y + this.unit * 0.1;
        this.moreBtn.tx = this.moreBtn.x;
        this.moreBtn.ty = this.moreBtn.y;
        this.moreBtn.spawned = false;

        this.sendFormOffset = this.unit * 4 * this.sendFormTime;
        if (this.isSendMode) {
            const offset = this.unit * 2.5 - this.sendFormOffset;
            this.carousel.height = this.unit * 5 - offset;
        }
        else {
            this.carousel.height -= this.sendFormEndTime * 2 * this.unit * 2.5;
        }

        if (!this.carousel.isDown) {
            this.carousel.scrollTime = updateTimer(elapsed, this.carousel.scrollTime, 10);
        }

        let singleMargin = 0;
        if (this.carousel.items.length <= 1) {
            singleMargin += this.unit * 0.5;
        }

        let x = this.carousel.x + singleMargin;
        let y = this.carousel.y;
        this.carousel.maxOffset = x;
        this.carousel.minOffset = -this.unit * 0.5;

        for (let i = 0; i < this.carousel.items.length; i += 1) {
            const item = this.carousel.items[i];
            item.x = x;
            item.y = y;
            item.height = this.carousel.height;
            item.width = this.carousel.colWidth;
            this.carousel.maxOffset += item.width;
            x += item.width;
            item.transitionTime = updateTimer(elapsed, item.transitionTime, 1.5);
        }

        if (this.placeHolderAsset) {
            this.placeHolderAsset.x = x;
            this.placeHolderAsset.y = y;
            this.placeHolderAsset.height = this.carousel.height;
            this.placeHolderAsset.width = this.carousel.colWidth;
            this.placeHolderAsset.transitionTime = 0;
        }

        this.carousel.hasBar = false;
        if (this.carousel.maxOffset > this.carousel.width) {
            this.carousel.hasBar = true;
            this.carousel.barSize = this.carousel.width * this.carousel.width / this.carousel.maxOffset;
        }
        else {
            this.carousel.offset = 0;
        }

        this.carousel.maxOffset -= this.carousel.width;

        if (this.carousel.maxOffset > 0) {
            if (!this.carousel.isDown) {
                if (this.carousel.wasDown) {
                    this.carousel.wasDown = false;
                }
                if (this.carousel.downDistance !== 0) {
                    const threshold = 0.3;
                    this.carousel.velocity = 0;
                    if (this.carousel.velocity) {
                        this.carousel.offset += this.carousel.downDistance * this.carousel.velocity;
                        this.carousel.downTime += elapsed * 0.15;

                        if (this.carousel.offset < this.carousel.minOffset - this.carousel.colWidth * 1.3) {
                            this.carousel.offset = this.carousel.minOffset - this.carousel.colWidth * 1.3;
                            this.carousel.downTime = threshold;
                        }
                        else if (this.carousel.offset > this.carousel.maxOffset + this.carousel.colWidth * 1.3) {
                            this.carousel.offset = this.carousel.maxOffset + this.carousel.colWidth * 1.3;
                            this.carousel.downTime = threshold;
                        }
                    }

                    if (this.carousel.downTime >= threshold) {
                        this.carousel.downDistance = 0;
                    }
                }
                else {
                    this.carousel.velocity = 0;
                }
            }

            if (!this.carousel.isDown) {
                if (this.carousel.offset < this.carousel.minOffset) {
                    this.carousel.offset += this.carousel.colWidth * elapsed * 6;
                    this.carousel.anchor = this.carousel.minOffset;
                    if (this.carousel.offset >= this.carousel.minOffset) {
                        this.carousel.offset = this.carousel.minOffset;
                    }
                }
                else if (this.carousel.offset > this.carousel.maxOffset - this.carousel.minOffset) {
                    this.carousel.offset -= this.carousel.colWidth * elapsed * 6;
                    this.carousel.anchor = this.carousel.maxOffset - this.carousel.minOffset;
                    if (this.carousel.offset <= this.carousel.maxOffset - this.carousel.minOffset) {
                        this.carousel.offset = this.carousel.maxOffset - this.carousel.minOffset;
                    }
                }

                if (!this.carousel.velocity && !this.carousel.canClick) {
                    if (!this.carousel.anchored) {
                        if (this.carousel.direction === -1) {
                            this.carousel.anchor = this.carousel.active * this.carousel.colWidth + this.carousel.minOffset;
                            this.carousel.offset = this.carousel.anchor;
                        }
                        else if (this.carousel.direction === 1) {
                            this.carousel.active = Math.min(this.carousel.items.length - 1, Math.ceil(this.carousel.offset / this.carousel.colWidth));
                            this.carousel.anchor = Math.floor(this.carousel.offset / this.carousel.colWidth + 1) * this.carousel.colWidth + this.carousel.minOffset;
                        }
                        else {
                            this.carousel.active = Math.max(0, Math.floor(this.carousel.offset / this.carousel.colWidth));
                            this.carousel.anchor = Math.floor(this.carousel.offset / this.carousel.colWidth) * this.carousel.colWidth + this.carousel.minOffset;
                        }
                        this.carousel.anchored = true;

                        if (this.carousel.oldActive !== this.carousel.active) {
                            this.carouselItem.selectTime = 0.5;
                            this.sendAmount = "";
                            this.carousel.oldActive = this.carousel.active;
                            this.onCarouselItemChanged();
                        }
                    }

                    if (this.carousel.offset < this.carousel.anchor) {
                        this.carousel.offset += this.carousel.colWidth * elapsed * 6;
                        if (this.carousel.offset > this.carousel.anchor) {
                            this.carousel.offset = this.carousel.anchor;
                        }
                        this.needRedraw = true;
                    }
                    else if (this.carousel.offset > this.carousel.anchor) {
                        this.carousel.offset -= this.carousel.colWidth * elapsed * 6;
                        if (this.carousel.offset < this.carousel.anchor) {
                            this.carousel.offset = this.carousel.anchor;
                        }
                        this.needRedraw = true;
                    }
                }
            }
            else {
                this.carousel.wasDown = true;
                this.carousel.downTime += elapsed;
                this.carousel.velocity = 0;

                if (this.carousel.offset < this.carousel.minOffset - this.carousel.colWidth * 1.3) {
                    this.carousel.offset = this.carousel.minOffset - this.carousel.colWidth * 1.3;
                }
                else if (this.carousel.offset > this.carousel.maxOffset + this.carousel.colWidth * 1.3) {
                    this.carousel.offset = this.carousel.maxOffset + this.carousel.colWidth * 1.3;
                }
            }
        }
    };

    // Update tabs.
    namespace.Pepper.View.prototype.updateTabs = function (elapsed) {
        this.transactionsBtn.width = this.viewport.width * 0.33;
        this.transactionsBtn.height = this.unit * 1.2;
        this.transactionsBtn.x = this.viewport.x;
        this.transactionsBtn.y = this.carousel.y + this.carousel.height + this.unit * 0.5;
        this.transactionsBtn.tx = this.transactionsBtn.x;
        this.transactionsBtn.ty = this.transactionsBtn.y;
        this.transactionsBtn.spawned = false;

        this.assetsBtn.width = this.viewport.width * 0.33;
        this.assetsBtn.height = this.unit * 1.2;
        this.assetsBtn.x = this.viewport.x + this.transactionsBtn.width;
        this.assetsBtn.y = this.carousel.y + this.carousel.height + this.unit * 0.5;
        this.assetsBtn.tx = this.assetsBtn.x;
        this.assetsBtn.ty = this.assetsBtn.y;
        this.assetsBtn.spawned = false;

        this.menuMarker.width = this.viewport.width * 0.33;
        this.menuMarker.height = this.unit * 0.07;
        this.menuMarker.tx = this.viewport.x + (this.tabId === 0 ? 0 : this.transactionsBtn.width);
        this.menuMarker.ty = this.carousel.y + this.carousel.height + this.unit * 0.5 + this.transactionsBtn.height - this.menuMarker.height * 0.5;
        this.menuMarker.y = this.menuMarker.ty;
        if (this.menuMarker.spawned) {
            this.menuMarker.x = this.menuMarker.tx;
            this.menuMarker.spawned = false;
            this.menuMarker.speed = 7;
        }

        this.filterBtn.width = this.unit * 0.9;
        this.filterBtn.height = this.unit * 0.9;
        this.filterBtn.tx = this.viewport.x + this.viewport.width - this.filterBtn.width * 1.2;
        this.filterBtn.ty = this.carousel.y + this.carousel.height + this.unit * 0.65;
        this.filterBtn.x = this.filterBtn.tx;
        this.filterBtn.y = this.filterBtn.ty;
        this.filterBtn.spawned = false;
        this.filterBtn.speed = 5;

        this.addAssetBtn.width = this.unit * 1.05;
        this.addAssetBtn.height = this.unit * 1.05;
        this.addAssetBtn.tx = this.viewport.x + this.viewport.width - this.addAssetBtn.width * 2.2 * 1.2;
        this.addAssetBtn.ty = this.carousel.y + this.carousel.height + this.unit * 0.6;
        this.addAssetBtn.x = this.addAssetBtn.tx;
        this.addAssetBtn.y = this.addAssetBtn.ty;
        this.addAssetBtn.spawned = false;
        this.addAssetBtn.speed = 5;
    };

    // Update the list.
    namespace.Pepper.View.prototype.updateList = function (elapsed) {
        this.needRedraw |=this.transactionsBtn.update(elapsed);
        this.needRedraw |=this.assetsBtn.update(elapsed);
        this.needRedraw |=this.menuMarker.update(elapsed);
        this.needRedraw |= this.filterBtn.update(elapsed);

        this.list.startTime = updateTimer(elapsed, this.list.startTime);

        this.list.headerHeight = this.unit * 1.5;
        this.list.rowHeight = this.unit * 1.8;
        this.list.x = this.viewport.x;
        this.list.y = this.viewport.y + this.unit * 6.7 + this.list.headerHeight;
        this.list.width = this.viewport.width;
        this.list.height = this.viewport.height - (this.list.headerHeight + this.unit * 8.5);

        if (!this.list.isDown) {
            this.list.scrollTime = updateTimer(elapsed, this.list.scrollTime, 2);
        }

        this.list.minOffset = 0;
        this.list.maxOffset = 0;
        let x = this.list.x;
        let y = this.list.y;
        this.list.maxOffset = this.list.y - (this.unit * 6.7 + this.list.headerHeight + namespace.Pepper.barHeight);

        for (let i = 0; i < this.list.items.length; i += 1) {
            let item = this.list.items[i];
            item.x = x;
            item.y = y;
            item.width = this.list.width;
            item.height = this.list.rowHeight;

            if (item.overCopyBtn) {
                item.copyButtonTime = 0.2;
            }
            else {
                item.copyButtonTime = updateTimer(elapsed, item.copyButtonTime, 1.2);
            }

            if (item.overLaunchBtn) {
                item.launchButtonTime = 0.2;
            }
            else {
                item.launchButtonTime = updateTimer(elapsed, item.launchButtonTime, 1.2);
            }

            if (item.overMemoBtn) {
                item.memoButtonTime = 0.2;
            }
            else {
                item.memoButtonTime = updateTimer(elapsed, item.memoButtonTime, 1.2);
            }

            if (item.insertTime) {
                const insertTime = Math.max(0, item.insertTime - 1.75);
                item.y -= insertTime * item.height * 4;
                item.insertTime = updateTimer(elapsed, item.insertTime);
            }
            this.list.maxOffset += item.height;
            y += item.height;
        }

        this.list.hasBar = false;
        if (this.list.maxOffset > this.list.height) {
            this.list.hasBar = true;
            this.list.barSize = this.list.height * this.list.height / this.list.maxOffset;
        }
        else {
            this.list.offset = 0;
        }

        this.list.maxOffset -= this.list.height;

        if (this.list.maxOffset > 0) {
            if (!this.list.isDown) {
                if (this.list.wasDown) {
                    this.list.wasDown = false;
                }
                if (this.list.downDistance !== 0) {
                    const threshold = 0.3;
                    const velocity = Math.max(0, threshold - this.list.downTime) * 1.5;
                    if (velocity) {
                        this.list.offset += this.list.downDistance * velocity;
                        this.list.downTime += elapsed * 0.15;

                        if (this.list.offset < this.list.minOffset - this.list.rowHeight * 1.3) {
                            this.list.offset = this.list.minOffset - this.list.rowHeight * 1.3;
                            this.list.downTime = threshold;
                        }
                        else if (this.list.offset > this.list.maxOffset + this.list.rowHeight * 1.3) {
                            this.list.offset = this.list.maxOffset + this.list.rowHeight * 1.3;
                            this.list.downTime = threshold;
                        }
                        this.needRedraw = true;
                    }

                    if (this.list.downTime >= threshold) {
                        this.list.downDistance = 0;
                    }
                }
            }

            if (!this.list.isDown) {
                if (this.list.offset < this.list.minOffset) {
                    this.list.offset += this.list.rowHeight * elapsed * 13;
                    if (this.list.offset > this.list.minOffset) {
                        this.list.offset = this.list.minOffset;
                    }
                    this.needRedraw = true;
                }
                else if (this.list.offset > this.list.maxOffset) {
                    this.list.offset -= this.list.rowHeight * elapsed * 13;
                    if (this.list.offset < this.list.maxOffset) {
                        this.list.offset = this.list.maxOffset;
                    }
                    this.needRedraw = true;
                }
            }
            else {
                this.list.wasDown = true;
                this.list.downTime += elapsed;

                if (this.list.offset < this.list.minOffset - this.list.rowHeight * 1.3) {
                    this.list.offset = this.list.minOffset - this.list.rowHeight * 1.3;
                }
                else if (this.list.offset > this.list.maxOffset + this.list.rowHeight * 1.3) {
                    this.list.offset = this.list.maxOffset + this.list.rowHeight * 1.3;
                }
            }
        }
    };

    // Update the numpad.
    namespace.Pepper.View.prototype.updateNumPad = function (elapsed) {
        this.needRedraw |=this.numPadCloseBtn.update(elapsed);
        this.needRedraw |=this.numPadSendBtn.update(elapsed);
        this.needRedraw |=this.bookBtn.update(elapsed);
        this.needRedraw |=this.qrBtn.update(elapsed);
        this.needRedraw |=this.pasteBtn.update(elapsed);

        this.numPadArea.x = this.viewport.x + this.unit * 0.5;
        this.numPadArea.width = this.viewport.width - this.unit;
        this.numPadArea.height = this.unit * 6;

        if (this.isSendMode) {
            const margin = (this.viewport.height - (this.carousel.height + this.numPadArea.height + this.unit * 1.5)) / 1.5;
            this.numPadArea.y = this.carousel.y + this.carousel.height +
                Math.max(this.unit * 2.5, margin);
            if (margin < this.unit * 2.5) {
                this.numPadArea.height -= this.unit * 2.5 - margin + this.unit;
            }
        }
        else {
            this.numPadArea.y = this.viewport.y + this.viewport.height - this.numPadArea.height - this.unit * 1.7 - this.unit * 0.1;
        }

        const width = this.numPadArea.width / 3;
        const height = this.numPadArea.height / 4;
        let x = this.numPadArea.x;
        let y = this.numPadArea.y;
        for (let i = 0; i < this.numPad.length; i += 1) {
            let element = this.numPad[i];

            if (i < 10) {
                element = this.numPad[this.numPadOrder[i]];
            }

            this.needRedraw |=element.update(elapsed);

            element.width = width;
            element.height = height;
            element.tx = x;
            element.ty = y;
            if (element.spawned) {
                element.x = element.tx;
                element.y = element.ty;
            }
            element.speed = 12;

            x += width;
            if (i === 2 || i === 5 || i === 8) {
                x = this.numPadArea.x;
                y += height;

                if (i === 8) {
                    x += width;
                }
            }

            if (i === 10) {
                x -= width * 3;
            }

            element.spawned = false;
        }

        this.numPadCloseBtn.width = this.unit * 1;
        this.numPadCloseBtn.height = this.unit * 1;
        this.numPadCloseBtn.x = this.viewport.x + this.viewport.width - this.numPadCloseBtn.width;
        this.numPadCloseBtn.y = this.carousel.y + this.carousel.height + this.unit * 0.4;
        this.numPadCloseBtn.tx = this.numPadCloseBtn.x;
        this.numPadCloseBtn.ty = this.numPadCloseBtn.y;
        this.numPadCloseBtn.spawned = false;

        this.numPadSendBtn.width = this.numPadArea.width;
        this.numPadSendBtn.height = this.unit * 1.3;
        this.numPadSendBtn.tx = this.numPadArea.x;
        this.numPadSendBtn.ty = namespace.Pepper.barHeight + this.viewport.x + this.viewport.height - (this.numPadSendBtn.height + this.unit * 0.4);
        this.numPadSendBtn.x = this.numPadSendBtn.tx;
        this.numPadSendBtn.y = this.numPadSendBtn.ty;
        if (this.numPadSendBtn.spawned) {
            this.numPadSendBtn.spawned = false;
            this.numPadSendBtn.speed = 11;
        }

        this.bookBtn.width = this.unit * 1;
        this.bookBtn.height = this.unit * 1;
        this.bookBtn.x = this.viewport.x + this.unit * 0.5;
        this.bookBtn.y = this.carousel.y + this.carousel.height + this.unit * 0.5;
        this.bookBtn.tx = this.bookBtn.x;
        this.bookBtn.ty = this.bookBtn.y;
        this.bookBtn.spawned = false;

        this.pasteBtn.width = this.unit * 1;
        this.pasteBtn.height = this.unit * 1;
        this.pasteBtn.x = this.viewport.x + this.unit * 0.5 + this.bookBtn.width * 1.5;
        this.pasteBtn.y = this.carousel.y + this.carousel.height + this.unit * 0.5;
        this.pasteBtn.tx = this.pasteBtn.x;
        this.pasteBtn.ty = this.pasteBtn.y;
        this.pasteBtn.spawned = false;

        this.qrBtn.width = this.unit * 1;
        this.qrBtn.height = this.unit * 1;
        this.qrBtn.x = this.viewport.x + this.unit * 0.5 + this.bookBtn.width * 1.5 + this.pasteBtn.width * 1.5;
        this.qrBtn.y = this.carousel.y + this.carousel.height + this.unit * 0.5;
        this.qrBtn.tx = this.qrBtn.x;
        this.qrBtn.ty = this.qrBtn.y;
        this.qrBtn.spawned = false;
    };

    // Draw the view.
    namespace.Pepper.View.prototype.draw = function (context) {
        context.save();

        context.imageSmoothingEnabled = true;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = this.getFont("Roboto-Regular");

        switch (this.page) {
            case namespace.Pepper.PageType.SignUp:
            case namespace.Pepper.PageType.SignIn:
                this.drawPinPage(context);
                break;
            case namespace.Pepper.PageType.Dashboard:
                this.drawDashboard(context);
                break;
        }

        if (this.showScroller) {
            this.drawScroller(context);
        }

        if (this.showModalPage) {
            this.drawModalPage(context);
        }

        switch (this.page) {
            case namespace.Pepper.PageType.SignUp:
            case namespace.Pepper.PageType.SignIn:
                if (this.globalOverlay) {
                    context.fillStyle = "rgba(0, 0, 0, 0.6)";
                    context.fillRect(
                        this.viewport.x - this.pinMenuOffset * this.viewport.width * 0.7,
                        this.viewport.y - namespace.Pepper.barHeight,
                        this.pinMenuOffset * this.viewport.width * 0.7 + this.viewport.width,
                        this.pinCodeBtn.y + this.viewport.height + namespace.Pepper.barHeight);
                }
                break;
            case namespace.Pepper.PageType.Dashboard:
                if (this.globalOverlay) {
                    context.fillStyle = "rgba(0, 0, 0, 0.6)";
                    context.fillRect(
                        this.viewport.x - this.dashboardMenuOffset * this.viewport.width * 0.7,
                        this.viewport.y - namespace.Pepper.barHeight,
                        this.dashboardMenuOffset * this.viewport.width * 0.7 + this.viewport.width,
                        this.pinCodeBtn.y + this.viewport.height + namespace.Pepper.barHeight);
                }
                break;
        }
        context.restore();
    };

    // Draw the modal page.
    namespace.Pepper.View.prototype.drawModalPage = function (context) {
        let width = this.viewport.width / 2 - this.unit * 0.6;
        let height = (this.viewport.height - this.unit * 4.2) / 14;

        context.save();
        context.translate(this.modalPageTime * this.viewport.width * 3, 0);
        if (this.modalPageEndTime > 0) {
            context.translate((0.3 - this.modalPageEndTime) * this.width * 3, 0);
        }
        else if (!this.showModalPage) {
            context.translate(this.width * 2, 0);
        }

        context.fillStyle = "rgb(255, 255, 255)";
        context.fillRect(this.viewport.x, this.viewport.y - namespace.Pepper.barHeight, this.viewport.width, this.viewport.height + namespace.Pepper.barHeight);

        if (this.modalStep <= namespace.Pepper.WizardType.BackupStep3) {
            context.textAlign = "center";
            context.fillStyle = namespace.Pepper.Resources.primaryColor;
            context.fillRect(this.viewport.x, this.viewport.y - namespace.Pepper.barHeight, this.viewport.width, this.unit * 3.8 + namespace.Pepper.barHeight);

            context.font = this.getFont("Roboto-Black");
            this.drawText(context, this.viewport.x + this.viewport.width * 0.5, this.viewport.y + this.unit * 0.7, namespace.Pepper.Resources.localeText[19], "rgb(255, 255, 255)", 0.81);

            let x = this.viewport.x + this.viewport.width * 0.5 - this.unit * 3;
            for (let i = 0; i < 3; i += 1) {

                let c1 = i === this.modalStep - 1 ? "rgb(255, 255, 255)" : "rgba(255, 255, 255, 0.2)";
                let c2 = i === this.modalStep - 1 ? "rgb(255, 255, 255)" : "rgba(255, 255, 255, 0.2)";
                let c3 = i > this.modalStep - 1 ? "rgba(255, 255, 255, 0.3)" : "rgb(0, 0, 0)";

                if (i < this.modalStep - 1) {
                    c1 = "rgb(185, 208, 95)";
                    c2 = "rgb(155, 179, 64)";
                    c3 = "rgb(255, 255, 255)";
                }

                if (!this.mnemonicSuccess && i === 1) {
                    c1 = "rgb(219, 83, 101)";
                    c2 = "rgb(219, 83, 101)";
                    c3 = "rgb(255, 255, 255)";
                }

                if (i < 2) {
                    context.fillStyle = "rgb(105, 211, 208)";
                    context.fillRect(x, this.viewport.y + this.unit * 2.1, this.unit * 3, this.unit * 0.1);
                }

                let trx = i === this.modalStep - 1 ? this.modalPageTransitionTime : 0;

                this.circle(context,
                    x,
                    this.viewport.y + this.unit * 2.1,
                    this.unit * 0.62 + trx * this.unit * 0.6, "rgb(105, 211, 208)");

                this.circle(context,
                    x,
                    this.viewport.y + this.unit * 2.1,
                    this.unit * 0.5 + trx * this.unit * 0.3, c1, true, c2);

                context.font = this.getFont("Roboto-Bold");
                this.drawText(context, x, this.viewport.y + this.unit * 2.1, (i + 1).toString(), c3, 1.2);
                context.font = this.getFont("Roboto-Medium");
                this.drawText(context, x, this.viewport.y + this.unit * 3.1, namespace.Pepper.Resources.localeText[24 + i], i > this.modalStep - 1 ? "rgba(255, 255, 255, 0.3)" : "rgb(255, 255, 255)", 0.68);
                x += this.unit * 3;
            }

            height = Math.min(this.viewport.width, this.modalPageBtn.y - (this.viewport.y + this.unit * 5 + this.unit * 0.2)) / 12;
            let margin = this.unit * 5 + Math.max(this.modalPageBtn.y - (this.viewport.y + this.unit * 5 + this.unit * 0.2) - this.viewport.width, 0) * 0.5;

            context.font = this.getFont("Roboto-Medium");
            if (this.modalStep === namespace.Pepper.WizardType.BackupStep1) {
                context.fillStyle = "rgb(36, 41, 46)";
                context.fillRect(this.viewport.x, this.viewport.y + this.unit * 3.8, this.viewport.width, this.unit * 1);
                this.drawText(context, this.viewport.x + this.viewport.width * 0.5, this.viewport.y + this.unit * 4.3, namespace.Pepper.Resources.localeText[20], "rgb(224, 115, 119)", 0.75);
            }
            else if (this.modalStep === namespace.Pepper.WizardType.BackupStep2) {
                context.fillStyle = "rgb(36, 41, 46)";
                context.fillRect(this.viewport.x, this.viewport.y + this.unit * 3.8, this.viewport.width, this.unit * 1);
                this.drawText(context, this.viewport.x + this.viewport.width * 0.5, this.viewport.y + this.unit * 4.3, namespace.Pepper.Resources.localeText[29], "rgba(255, 255, 255, 0.7)", 0.75);
            }
            else {
                if (this.mnemonicSuccess) {
                    margin = (this.viewport.y + this.viewport.height * 0.5 - this.unit * 5.6 - this.viewport.y) * 0.5;
                    const trx = this.modalPageTransitionTime * this.unit * this.modalPageBtn.heartBeats[0].time * 3;
                    context.font = this.getFont("Roboto-Bold");
                    context.drawImage(namespace.Pepper.Resources.successImage, this.viewport.x + this.viewport.width * 0.5 - this.unit * 0.75 - trx, this.viewport.y + this.unit * 3.5 - trx + margin, this.unit * 1.5 + trx * 2, this.unit * 1.5 + trx * 2);
                    this.drawText(context, this.viewport.x + this.viewport.width * 0.5 - trx, this.viewport.y + this.unit * 5.3 + margin, namespace.Pepper.Resources.localeText[31], "rgb(185, 208, 95)", 1.3);

                    context.font = this.getFont("Roboto-Medium");
                    this.drawText(context, this.viewport.x + this.viewport.width * 0.5, this.viewport.y + this.unit * 7 + margin, namespace.Pepper.Resources.localeText[36], "rgb(36, 41, 46)", 0.77);

                    context.font = this.getFont("Roboto-Regular");
                    this.drawText(context, this.viewport.x + this.viewport.width * 0.5, this.viewport.y + this.unit * 8.6 + margin, namespace.Pepper.Resources.localeText[37], "rgb(36, 41, 46)", 0.73);
                    this.drawText(context, this.viewport.x + this.viewport.width * 0.5, this.viewport.y + this.unit * 9.1 + margin, namespace.Pepper.Resources.localeText[38], "rgb(36, 41, 46)", 0.73);

                }
                else {
                    margin = (this.viewport.y + this.viewport.height * 0.5 - this.unit * 5.6 - this.viewport.y) * 0.5;
                    const trx = this.modalPageTransitionTime * this.unit * this.modalPageBtn.heartBeats[0].time * 3;
                    context.font = this.getFont("Roboto-Bold");
                    context.drawImage(namespace.Pepper.Resources.errorImage, this.viewport.x + this.viewport.width * 0.5 - this.unit * 0.75 - trx, this.viewport.y + this.unit * 3.5 + margin, this.unit * 1.5, this.unit * 1.5);
                    this.drawText(context, this.viewport.x + this.viewport.width * 0.5 + trx, this.viewport.y + this.unit * 5.3 + margin, namespace.Pepper.Resources.localeText[32], "rgb(219, 83, 101)", 1.3);

                    context.font = this.getFont("Roboto-Medium");
                    this.drawText(context, this.viewport.x + this.viewport.width * 0.5, this.viewport.y + this.unit * 7.5 + margin, namespace.Pepper.Resources.localeText[33], "rgb(36, 41, 46)", 0.77);

                    context.font = this.getFont("Roboto-Regular");
                    this.drawText(context, this.viewport.x + this.viewport.width * 0.5, this.viewport.y + this.unit * 8.6 + margin, namespace.Pepper.Resources.localeText[34], "rgb(36, 41, 46)", 0.73);
                    this.drawText(context, this.viewport.x + this.viewport.width * 0.5, this.viewport.y + this.unit * 9.1 + margin, namespace.Pepper.Resources.localeText[35], "rgb(36, 41, 46)", 0.73);
                }
            }

            context.font = this.getFont("Roboto-Medium");
            if (height > 0 && this.modalStep === namespace.Pepper.WizardType.BackupStep1) {
                context.textAlign = "left";
                for (let i = 0; i < 12; i += 1) {
                    context.fillStyle = "rgb(0, 0, 0)";
                    this.roundRect(context, this.viewport.x + width * 0.025 + this.unit * 1.4, this.viewport.y + i * height + margin, width * 0.965 - this.unit * 0.8, height * 0.95, height * 0.5, "rgba(0, 0, 0, 0.09)");
                    this.roundRect(context, this.viewport.x + width + this.unit * 1.42, this.viewport.y + i * height + margin, width * 0.975 - this.unit * 0.8, height * 0.95, height * 0.5, "rgba(0, 0, 0, 0.09)");
                    this.roundRect(context, this.viewport.x + width * 0.025 + this.unit * 0.6, this.viewport.y + i * height + margin, width * 0.18, height * 0.95, height * 0.5, "rgba(0, 0, 0, 0.2)");
                    this.roundRect(context, this.viewport.x + width + this.unit * 0.62, this.viewport.y + i * height + margin, width * 0.18, height * 0.95, height * 0.5, "rgba(0, 0, 0, 0.2)");
                    this.drawText(context, this.viewport.x + width * 0.06 + this.unit * 0.6, this.viewport.y + i * height + margin + height * 0.5, i < 9 ? " " + (i + 1) : (i + 1).toString(), "rgb(255, 255, 255)", 0.75);
                    this.drawText(context, this.viewport.x + width * 1.035 + this.unit * 0.6, this.viewport.y + i * height + margin + height * 0.5, (i + 13).toString(), "rgb(255, 255, 255)", 0.75);
                    if (namespace.Core.currentAccount.mnemonic) {
                        this.drawText(context, this.viewport.x + width * 0.23 + this.unit * 0.8, this.viewport.y + i * height + margin + height * 0.46, namespace.Core.currentAccount.mnemonic[i], "rgb(36, 41, 46)", 0.75);
                        this.drawText(context, this.viewport.x + width * 1.21 + this.unit * 0.8, this.viewport.y + i * height + margin + height * 0.46, namespace.Core.currentAccount.mnemonic[i + 12], "rgb(36, 41, 46)", 0.75);
                    }
                }
            }
        }
        else if (this.modalStep === namespace.Pepper.WizardType.ViewAsset) {
            this.drawAssetDetails(context);
        }
        else if (this.modalStep === namespace.Pepper.WizardType.ImportAccount) {

            context.fillStyle = namespace.Pepper.Resources.primaryColor;
            context.fillRect(this.viewport.x, this.viewport.y - namespace.Pepper.barHeight, this.viewport.width, this.unit * 1.8 + namespace.Pepper.barHeight);

            context.textAlign = "center";
            context.font = this.getFont("Roboto-Black");
            this.drawText(context, this.viewport.x + this.viewport.width * 0.5, this.viewport.y + this.unit * 1, namespace.Pepper.Resources.localeText[150], "rgb(255, 255, 255)", 0.81);

            context.font = this.getFont("Roboto-Medium");
            this.drawText(context, this.viewport.x + this.viewport.width * 0.5, this.viewport.y + this.unit * 2.5, namespace.Pepper.Resources.localeText[136], "rgb(36, 41, 46)", 0.75);
            this.drawText(context, this.viewport.x + this.viewport.width * 0.5, this.viewport.y + this.unit * 3.1, namespace.Pepper.Resources.localeText[137], "rgb(36, 41, 46)", 0.75);
        }

        if (this.modalStep === namespace.Pepper.WizardType.ImportAccount) {
            context.save();
            if (this.closeModalBtn.hover || this.closeModalBtn.selected) {
                context.globalAlpha = 0.7 * context.globalAlpha;
            }
            context.drawImage(namespace.Pepper.Resources.closeImage, this.closeModalBtn.x, this.closeModalBtn.y + this.unit * 0.17, this.closeModalBtn.width, this.closeModalBtn.width);
            context.restore();

            context.save();
            if (this.modalQrBtn.hover || this.modalQrBtn.selected) {
                context.globalAlpha = 0.7 * context.globalAlpha;
            }
            context.drawImage(namespace.Pepper.Resources.qrImage, this.modalQrBtn.x, this.modalQrBtn.y + this.unit * 0.17, this.modalQrBtn.width, this.modalQrBtn.width);
            context.restore();

            context.save();
            if (this.modalPasswordBtn.hover || this.modalPasswordBtn.selected) {
                context.globalAlpha = 0.7 * context.globalAlpha;
            }
            context.drawImage(namespace.Pepper.Resources.visibleImage, this.modalPasswordBtn.x, this.modalPasswordBtn.y + this.unit * 0.17, this.modalPasswordBtn.width, this.modalPasswordBtn.width);
            context.restore();
        }

        let text = namespace.Pepper.Resources.localeText[28];
        if (this.modalStep === namespace.Pepper.WizardType.BackupStep1) {
            text = namespace.Pepper.Resources.localeText[27];
        }
        else if (this.modalStep === namespace.Pepper.WizardType.BackupStep2) {
            text = namespace.Pepper.Resources.localeText[25];
        }
        else if (this.modalStep === namespace.Pepper.WizardType.ImportAccount) {
            text = namespace.Pepper.Resources.localeText[148];
        }

        context.textAlign = "center";
        let color = namespace.Pepper.Resources.primaryColor;
        let textColor = "rgb(255, 255, 255)";
        if (this.modalPageBtn.hover) {
            textColor = "rgba(255, 255, 255, 0.7)";
        }
        if (this.modalPageBtn.selected) {
            color = "rgb(41, 180, 200)";
        }

        this.roundRect(context, this.modalPageBtn.x, this.modalPageBtn.y, this.modalPageBtn.width, this.modalPageBtn.height, this.unit * 0.1, color);
        context.font = this.getFont("Roboto-Regular");
        this.drawText(context, this.modalPageBtn.x + this.modalPageBtn.width * 0.5, this.modalPageBtn.y + this.modalPageBtn.height * 0.5, text, textColor, 1);

        context.restore();
    };

    // Draw the asset details.
    namespace.Pepper.View.prototype.drawAssetDetails = function (context) {
        let item = {
            "x": this.viewport.x,
            "y": this.viewport.y + this.unit * 1.2,
            "height": this.unit * 1.8,
            "width": this.viewport.width,
            "data": this.selectedAsset.data,
            "hasAdd": this.selectedAsset.hasAdd,
            "overAddBtn": this.modalAddAssetBtn.over || this.modalAddAssetBtn.selected
        };

        context.save();
        context.textAlign = "center";
        context.font = this.getFont("Roboto-Bold");
        context.fillStyle = namespace.Pepper.Resources.primaryColor;
        context.fillRect(this.viewport.x, this.viewport.y - namespace.Pepper.barHeight, this.viewport.width, this.unit * 1.2 + namespace.Pepper.barHeight);
        this.drawText(context, this.viewport.x + this.viewport.width * 0.5, this.viewport.y + this.unit * 0.55, item.data.name, "rgba(255, 255, 255, 0.8)", 0.9);

        if (item.data) {
            if (!item.data.loaded) {
                this.drawLoader(context, item.x + item.width * 0.5, item.y + item.height * 0.5, this.unit * 0.7, true);
            }
            else {

                if (!item.data.validImage || item.data.code === "XLM") {
                    this.circle(context, item.x + this.unit * 1.21, item.y + this.unit * 0.04, this.unit * 0.8, "rgb(255, 255, 255)");
                }

                if (item.data.validImage) {
                    context.drawImage(item.data.image, item.x + this.unit * 0.35, item.y - this.unit * 0.8, this.unit * 1.6, this.unit * 1.6);
                }
                else if (item.data.code === "XLM") {
                    context.drawImage(namespace.Pepper.Resources.stellarImage, item.x + this.unit * 0.35, item.y - this.unit * 0.8, this.unit * 1.6, this.unit * 1.6);
                }

                context.textAlign = "center";
                context.font = this.getFont("Roboto-Bold");
                this.drawText(context, item.x + this.unit * 1.2, item.y + this.unit * 1.4, item.data.code, "rgb(50, 47, 66)", 1);

                context.textAlign = "right";
                context.font = this.getFont("Roboto-Light");
                this.drawText(context, item.x + item.width - this.unit * 1.2, item.y + item.height - this.unit * 1.41, item.data.domain, "rgba(50, 47, 66, 0.5)", 0.8);

                if (item.data.deposit) {
                    this.drawText(context, item.x + item.width - this.unit * 1.2, item.y + item.height - this.unit * 0.88, namespace.Pepper.Resources.localeText[42], "rgb(23, 156, 75)", 0.7);
                    context.drawImage(namespace.Pepper.Resources.seamlessImage, item.x + item.width - this.unit, item.y + item.height - this.unit * 1.55, this.unit * 0.7, this.unit * 0.7);
                }
                else if (item.data.verified) {
                    this.drawText(context, item.x + item.width - this.unit * 1.2, item.y + item.height - this.unit * 0.88, namespace.Pepper.Resources.localeText[42], "rgb(23, 156, 75)", 0.7);
                    context.drawImage(namespace.Pepper.Resources.shieldImage, item.x + item.width - this.unit, item.y + item.height - this.unit * 1.55, this.unit * 0.7, this.unit * 0.7);
                }
                else {
                    this.drawText(context, item.x + item.width - this.unit * 1.2, item.y + item.height - this.unit * 0.88, namespace.Pepper.Resources.localeText[43], "rgb(255, 30, 55)", 0.7);
                    context.drawImage(namespace.Pepper.Resources.warningImage, item.x + item.width - this.unit, item.y + item.height - this.unit * 1.55, this.unit * 0.7, this.unit * 0.7);
                }

                if (item.data.balance) {
                    context.textAlign = "left";
                    context.font = this.getFont("Roboto-Regular");
                    this.drawText(context, item.x + this.unit * 2.5, item.y + this.unit * 0.4, namespace.Pepper.Resources.localeText[40], "rgba(50, 47, 66, 0.5)", 0.75);
                    this.drawText(context, item.x + this.unit * 2.5, item.y + this.unit * 0.93, namespace.Pepper.Tools.formatPrice(item.data.balance, item.data.decimals), "rgb(23, 156, 75)", 0.9);
                }
                else {
                    if (!namespace.Pepper.queryAsset) {
                        context.textAlign = "center";
                        context.font = this.getFont("Roboto-Bold");

                        if (item.hasAdd) {
                            if (item.overAddBtn) {
                                this.roundRect(context, this.modalAddAssetBtn.x, this.modalAddAssetBtn.y, this.modalAddAssetBtn.width, this.modalAddAssetBtn.height, this.unit * 0.18, namespace.Pepper.Resources.primaryColor, true, namespace.Pepper.Resources.primaryColor);
                                this.drawText(context, this.modalAddAssetBtn.x + this.modalAddAssetBtn.width * 0.5, this.modalAddAssetBtn.y + this.unit * 0.41, namespace.Pepper.Resources.localeText[62], "rgb(255, 255, 255)", 0.7);
                            }
                            else {
                                this.roundRect(context, this.modalAddAssetBtn.x, this.modalAddAssetBtn.y, this.modalAddAssetBtn.width, this.modalAddAssetBtn.height, this.unit * 0.18, "rgba(255, 255, 255, 0)", true, namespace.Pepper.Resources.primaryColor);
                                this.drawText(context, this.modalAddAssetBtn.x + this.modalAddAssetBtn.width * 0.5, this.modalAddAssetBtn.y + this.unit * 0.41, namespace.Pepper.Resources.localeText[62], namespace.Pepper.Resources.primaryColor, 0.7);
                            }
                        }
                        else {
                            this.roundRect(context, this.modalAddAssetBtn.x, this.modalAddAssetBtn.y, this.modalAddAssetBtn.width, this.modalAddAssetBtn.height, this.unit * 0.18, "rgba(255, 255, 255, 0)", true, "rgba(0, 0, 0, 0.1)");
                            this.drawText(context, this.modalAddAssetBtn.x + this.modalAddAssetBtn.width * 0.5, this.modalAddAssetBtn.y + this.unit * 0.41, namespace.Pepper.Resources.localeText[62], "rgba(0, 0, 0, 0.1)", 0.7);
                        }
                    }
                    else if (item.data === namespace.Pepper.queryAsset) {
                        this.roundRect(context, this.modalAddAssetBtn.x, this.modalAddAssetBtn.y, this.modalAddAssetBtn.width, this.modalAddAssetBtn.height, this.unit * 0.18, "rgba(255, 255, 255, 0)", true, "rgba(0, 0, 0, 0.35)");
                        this.drawLoader(context, this.modalAddAssetBtn.x + this.modalAddAssetBtn.width * 0.5, this.modalAddAssetBtn.y + this.unit * 0.41, this.unit * 0.7, true);
                    }
                    else {
                        context.textAlign = "center";
                        context.font = this.getFont("Roboto-Bold");
                        this.roundRect(context, this.modalAddAssetBtn.x, this.modalAddAssetBtn.y, this.modalAddAssetBtn.width, this.modalAddAssetBtn.height, this.unit * 0.18, "rgba(255, 255, 255, 0)", true, "rgba(0, 0, 0, 0.1)");
                        this.drawText(context, this.modalAddAssetBtn.x + this.modalAddAssetBtn.width * 0.5, this.modalAddAssetBtn.y + this.unit * 0.41, namespace.Pepper.Resources.localeText[125], "rgba(0, 0, 0, 0.1)", 0.7);
                    }

                    if (!item.hasAdd) {
                        context.font = this.getFont("Roboto-Regular");
                        context.textAlign = "left";
                        this.drawText(context, this.modalAddAssetBtn.x, this.modalAddAssetBtn.y + this.unit * 1.17, namespace.Pepper.Resources.localeText[132], "rgb(219, 83, 101)", 0.6);
                   }
                }
            }
        }
        context.restore();
    };

    // Draw the scroller.
    namespace.Pepper.View.prototype.drawScroller = function (context) {
        let text;

        context.save();

        switch (this.scroller.type) {
            case namespace.Pepper.ScrollerType.AddAsset:
            case namespace.Pepper.ScrollerType.Assets:
            case namespace.Pepper.ScrollerType.Currencies:
                context.translate(0, this.scrollerTime * this.viewport.width * 6);
                break;
            case namespace.Pepper.ScrollerType.FilterMenu:
            case namespace.Pepper.ScrollerType.AssetsMenu:
                context.translate(this.scroller.translatePoint.x, this.scroller.translatePoint.y);
                context.scale(1 - this.scrollerTime * 3, 1 - this.scrollerTime * 3);
                context.translate(-this.scroller.translatePoint.x, -this.scroller.translatePoint.y);
                break;
            default:
                context.translate(this.scrollerTime * this.viewport.width * 4, 0);
                break;
        }

        context.globalAlpha = (0.25 - this.scrollerTime) * 4 * context.globalAlpha;
        if (this.scrollerEndTime > 0) {
            switch (this.scroller.type) {
                case namespace.Pepper.ScrollerType.AddAsset:
                case namespace.Pepper.ScrollerType.Assets:
                case namespace.Pepper.ScrollerType.Currencies:
                    context.translate(0, (0.3 - this.scrollerEndTime) * this.width * 5);
                    break;
                case namespace.Pepper.ScrollerType.FilterMenu:
                case namespace.Pepper.ScrollerType.AssetsMenu:
                    context.globalAlpha = context.globalAlpha * this.scrollerEndTime * 3;
                    context.translate(this.scroller.translatePoint.x, this.scroller.translatePoint.y);
                    context.scale(this.scrollerEndTime * 3, this.scrollerEndTime * 3);
                    context.translate(-this.scroller.translatePoint.x, -this.scroller.translatePoint.y);
                    break;
                default:
                    context.translate((0.3 - this.scrollerEndTime) * this.width * 3, 0);
                    break;
            }
        }
        else if (!this.showScroller) {
            context.translate(this.width * 2, 0);
        }

        context.fillStyle = "rgb(255, 255, 255)";

        switch (this.scroller.type) {
            case namespace.Pepper.ScrollerType.FilterMenu:
            case namespace.Pepper.ScrollerType.AssetsMenu:
                context.save();
                context.fillStyle = "rgb(255, 255, 255)";
                context.shadowColor = "rgba(0, 0, 0, 0.3)";
                context.shadowBlur = this.unit * 0.3;
                if (this.scroller.items.length) {
                    const lastItem = this.scroller.items[this.scroller.items.length - 1];
                    const height = lastItem.y + lastItem.height - this.scroller.y;
                    context.fillRect(this.scroller.x, this.scroller.y, this.scroller.width, height);
                }
                context.restore();
                break;
            case namespace.Pepper.ScrollerType.AddAsset:
            case namespace.Pepper.ScrollerType.Assets:
            case namespace.Pepper.ScrollerType.Currencies:
                context.save();
                context.shadowColor = "rgba(0, 0, 0, 0.3)";
                context.shadowBlur = this.unit * 0.1;
                context.fillRect(this.scroller.x, this.scroller.y, this.width, this.scroller.height);
                context.restore();
                break;
            default:
                context.fillRect(this.scroller.x, this.scroller.y - this.scroller.headerHeight - namespace.Pepper.barHeight, this.width, this.scroller.height + this.scroller.headerHeight + namespace.Pepper.barHeight);
                break;
        }
        context.textAlign = "left";
        context.font = this.getFont("Roboto-Regular");

        context.save();
        context.beginPath();
        switch (this.scroller.type) {
            case namespace.Pepper.ScrollerType.AccountSettings:
            case namespace.Pepper.ScrollerType.FilterMenu:
            case namespace.Pepper.ScrollerType.AssetsMenu:
            case namespace.Pepper.ScrollerType.AddAsset:
            case namespace.Pepper.ScrollerType.Assets:
            case namespace.Pepper.ScrollerType.Currencies:
                context.rect(this.scroller.x, this.scroller.y, this.scroller.width, this.scroller.height);
                break;
            default:
                context.rect(this.scroller.x, this.scroller.y - this.unit * 0.2, this.scroller.width, this.scroller.height + this.unit * 0.2);
                break;
        }
        context.clip();

        context.save();
        context.translate(0, -this.scroller.offset);

        switch (this.scroller.type) {
            case namespace.Pepper.ScrollerType.AddAsset:
            case namespace.Pepper.ScrollerType.Assets:
            case namespace.Pepper.ScrollerType.Currencies:
                context.textAlign = "center";
                break;
            default:
                break;
        }

        for (let i = 0; i < this.scroller.items.length; i += 1) {
            let item = this.scroller.items[i];

            if (item.y - this.scroller.offset + item.height > this.scroller.y
                && item.y - this.scroller.offset - item.height < this.scroller.y + this.scroller.height) {

                if (this.scroller.type === namespace.Pepper.ScrollerType.AddAsset) {
                    this.drawListItem(context, item);
                    continue;
                }

                let textColor = "rgb(36, 41, 46)";
                if (this.scroller.type === namespace.Pepper.ScrollerType.AssetsMenu) {
                    context.fillStyle = (item.selected || item.hover) && item.enabled ? "rgba(36, 41, 46, 0.07)" : "rgb(255, 255, 255)";
                }
                else {
                    context.fillStyle = item.selected || item.hover ? "rgba(36, 41, 46, 0.07)" : "rgb(255, 255, 255)";
                }
                if (item.current) {
                    context.font = this.getFont("Roboto-Bold");
                    context.fillStyle = "rgb(50, 98, 115)";
                    textColor = "rgb(255, 255, 255)";
                }
                else {
                    context.font = this.getFont("Roboto-Regular");

                    if (this.scroller.type === namespace.Pepper.ScrollerType.AccountSettings && item.id === this.scroller.items.length - 1) {
                        if (this.deleteStep) {
                            context.font = this.getFont("Roboto-Bold");
                            context.fillStyle = "rgb(219, 83, 101)";
                            textColor = "rgb(255, 255, 255)";
                            if (item.selected || item.hover) {
                                textColor = "rgba(255, 255, 255, 0.6)";
                            }
                        }
                        else {
                            textColor = "rgb(219, 83, 101)";
                        }
                    }

                    if (this.scroller.type === namespace.Pepper.ScrollerType.AccountSettings && item.id === this.scroller.items.length - 2) {
                        textColor = "rgb(219, 83, 101)";
                    }
                }

                if (this.scroller.type !== namespace.Pepper.ScrollerType.AccountSettings) {
                    context.fillRect(item.x, item.y, item.width, item.height);
                    context.fillStyle = "rgba(36, 41, 46, 0.07)";
                    context.fillRect(item.x, item.y + item.height - this.unit * 0.03, item.width, this.unit * 0.03);
                }

                if (this.scroller.type === namespace.Pepper.ScrollerType.FilterMenu) {
                    const scale = item.time * this.unit * 0.4;
                    this.drawText(context, item.x + this.unit * 1, item.y + item.height * 0.5, item.label, textColor, 0.79);
                    context.drawImage(this.account.filters[item.id] ? namespace.Pepper.Resources.optSelImage : namespace.Pepper.Resources.optImage,
                        item.x + this.unit * 0.2 - scale, item.y + item.height * 0.27 - scale, this.unit * 0.6 + scale * 2, this.unit * 0.6 + scale * 2);
                }
                else if (this.scroller.type === namespace.Pepper.ScrollerType.AccountSettings) {
                    if (item.id === this.scroller.items.length - 2 || item.id === 4) {
                        context.save();
                        if (namespace.Core.currentAccount.nobackup) {
                            context.globalAlpha = context.globalAlpha * 0.3;
                        }
                        else {
                            context.fillRect(item.x, item.y, item.width, item.height);
                            context.fillStyle = "rgba(36, 41, 46, 0.07)";
                            context.fillRect(item.x, item.y + item.height - this.unit * 0.03, item.width, this.unit * 0.03);
                        }
                    }
                    else {
                        context.fillRect(item.x, item.y, item.width, item.height);
                        context.fillStyle = "rgba(36, 41, 46, 0.07)";
                        context.fillRect(item.x, item.y + item.height - this.unit * 0.03, item.width, this.unit * 0.03);
                    }

                    this.drawText(context, item.x + this.unit * 1.1, item.y + item.height * 0.5, item.label, textColor, 0.79);
                    if (item.id === this.scroller.items.length - 2 || item.id === 4) {
                        context.restore();
                    }

                    if (item.id === 0) {
                        context.drawImage(namespace.Pepper.Resources.penImage, item.x + this.unit * 0.2, item.y + this.unit * 0.2, item.height * 0.6, item.height * 0.6);
                    }
                    else if (item.id === 1) {
                        context.drawImage(namespace.Pepper.Resources.currencyImage, item.x + this.unit * 0.2, item.y + this.unit * 0.2, item.height * 0.6, item.height * 0.6);
                        context.save();
                        context.font = this.getFont("Roboto-Bold");
                        context.textAlign = "center";
                        context.fillStyle = "rgba(36, 41, 46, 0.07)";
                        context.fillRect(item.x + item.width * 0.7, item.y, this.unit * 0.03, item.height - this.unit * 0.03);
                        this.drawText(context, item.x + item.width * 0.85, item.y + item.height * 0.5, this.account.currency, textColor, 0.79);
                        context.restore();
                    }
                    else if (item.id === 2) {
                        context.drawImage(namespace.Pepper.Resources.notificationImage, item.x + this.unit * 0.2, item.y + this.unit * 0.2, item.height * 0.6, item.height * 0.6);
                        context.save();
                        context.fillStyle = "rgba(36, 41, 46, 0.07)";
                        context.fillRect(item.x + item.width * 0.7, item.y, this.unit * 0.03, item.height - this.unit * 0.03);
                        context.drawImage(this.account.nonotif ? namespace.Pepper.Resources.toggleoffImage : namespace.Pepper.Resources.toggleonImage, item.x + item.width * 0.8, item.y + this.unit * 0.05, item.height * 0.9, item.height * 0.9);
                        context.restore();
                    }
                    else if (item.id === 3) {
                        context.drawImage(namespace.Pepper.Resources.keyboardImage, item.x + this.unit * 0.2, item.y + this.unit * 0.2, item.height * 0.6, item.height * 0.6);
                        context.save();
                        context.fillStyle = "rgba(36, 41, 46, 0.07)";
                        context.fillRect(item.x + item.width * 0.7, item.y, this.unit * 0.03, item.height - this.unit * 0.03);
                        context.drawImage(this.account.notoast ? namespace.Pepper.Resources.toggleoffImage : namespace.Pepper.Resources.toggleonImage, item.x + item.width * 0.8, item.y + this.unit * 0.05, item.height * 0.9, item.height * 0.9);
                        context.restore();
                    }
                    else if (item.id === 4) {
                        context.drawImage(namespace.Pepper.Resources.lmtAccountImage, item.x + this.unit * 0.2, item.y + this.unit * 0.2, item.height * 0.6, item.height * 0.6);
                    }
                    else if (item.id === this.scroller.items.length - 2) {
                        context.save();
                        if (namespace.Core.currentAccount.nobackup) {
                            context.globalAlpha = context.globalAlpha * 0.3;
                        }
                        context.drawImage(namespace.Pepper.Resources.warningImage, item.x + this.unit * 0.2, item.y + this.unit * 0.2, item.height * 0.6, item.height * 0.6);
                        context.restore();
                    }
                    else if (item.id === this.scroller.items.length - 1) {
                        if (this.deleteStep) {
                            context.drawImage(namespace.Pepper.Resources.deleteLightImage, item.x + this.unit * 0.2, item.y + this.unit * 0.2, item.height * 0.6, item.height * 0.6);
                        }
                        else {
                            context.drawImage(namespace.Pepper.Resources.deleteImage, item.x + this.unit * 0.2, item.y + this.unit * 0.2, item.height * 0.6, item.height * 0.6);
                        }
                    }
                }
                else if (this.scroller.type === namespace.Pepper.ScrollerType.Assets) {
                    this.drawText(context, item.x + item.width * 0.5, item.y + item.height * 0.5, item.label, textColor, 0.79);
                }
                else if (this.scroller.type === namespace.Pepper.ScrollerType.Currencies) {
                    this.drawText(context, item.x + item.width * 0.5, item.y + item.height * 0.5, item.label, textColor, 0.79);
                }
                else if (this.scroller.type === namespace.Pepper.ScrollerType.AddAsset) {
                    this.drawText(context, item.x + item.width * 0.5, item.y + item.height * 0.5, item.label, textColor, 0.79);
                }
                else if (this.scroller.type === namespace.Pepper.ScrollerType.AssetsMenu) {
                    textColor = item.enabled ? textColor : "rgba(36, 41, 46, 0.3)";
                    this.drawText(context, item.x + this.unit * 0.5, item.y + item.height * 0.5, item.label, textColor, 0.79);
                }
                else {
                    this.drawText(context, item.x + this.unit * 0.5, item.y + item.height * 0.5, item.label, textColor, 0.79);
                }
            }
        }
        context.restore();

        if (this.scroller.hasBar && (this.scroller.isDown || this.scroller.scrollTime)) {
            const barwidth = this.unit * 0.1;
            let alpha = context.globalAlpha;
            let limitedOffset = Math.max(0, Math.min(this.scroller.maxOffset, this.scroller.offset));
            let offset = limitedOffset * this.scroller.height / (this.scroller.maxOffset + this.scroller.height);
            context.globalAlpha = Math.min(1, this.scroller.scrollTime) * alpha;
            this.roundRect(context, this.scroller.x - barwidth + this.scroller.width, this.scroller.y, barwidth, this.scroller.height, barwidth * 0.5, "rgba(0, 0, 0, 0.1)");
            this.roundRect(context, this.scroller.x - barwidth + this.scroller.width, this.scroller.y + offset, barwidth, this.scroller.barSize, barwidth * 0.5, "rgba(0, 0, 0, 0.3)");
            context.globalAlpha = alpha;
        }
        context.restore();

        if (this.scroller.type !== namespace.Pepper.ScrollerType.AddAsset
            && this.scroller.type !== namespace.Pepper.ScrollerType.Assets
            && this.scroller.type !== namespace.Pepper.ScrollerType.Currencies
            && this.scroller.type !== namespace.Pepper.ScrollerType.AssetsMenu
            && this.scroller.type !== namespace.Pepper.ScrollerType.FilterMenu) {
            context.save();
            context.shadowColor = "rgba(0, 0, 0, 0.14)";
            context.fillStyle = namespace.Pepper.Resources.primaryColor;
            context.shadowBlur = this.unit * 0.1;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = this.unit * 0.05;
            context.fillRect(this.scroller.x, this.scroller.y - this.scroller.headerHeight - namespace.Pepper.barHeight, this.scroller.width, this.scroller.headerHeight + namespace.Pepper.barHeight);
            context.restore();

            switch (this.scroller.type) {
                case namespace.Pepper.ScrollerType.Accounts:
                    text = namespace.Pepper.Resources.localeText[10];
                    break;
                case namespace.Pepper.ScrollerType.Languages:
                    text = namespace.Pepper.Resources.localeText[13];
                    break;
                case namespace.Pepper.ScrollerType.Addresses:
                    text = namespace.Pepper.Resources.localeText[152];
                    break;
                case namespace.Pepper.ScrollerType.AccountSettings:
                    text = namespace.Pepper.Resources.localeText[138];
                    break;
                case namespace.Pepper.ScrollerType.AddAsset:
                case namespace.Pepper.ScrollerType.Assets:
                case namespace.Pepper.ScrollerType.Currencies:
                case namespace.Pepper.ScrollerType.AssetsMenu:
                case namespace.Pepper.ScrollerType.FilterMenu:
                    break;
            }

            context.textAlign = "center";
            context.font = this.getFont("Roboto-Bold");
            this.drawText(context, this.scroller.x + this.scroller.width * 0.5, this.scroller.y - this.scroller.headerHeight + this.unit * 0.7, text, "rgb(255, 255, 255)", 0.85);
            if (this.scroller.type === namespace.Pepper.ScrollerType.AccountSettings) {
                context.textAlign = "left";
                this.drawText(context, this.scroller.x + this.unit * 0.5, this.scroller.y - this.scroller.headerHeight + this.unit * 2, this.account.name, "rgb(255, 255, 255)", 0.85);
            }
            context.drawImage(namespace.Pepper.Resources.arrowLeftImage, this.scroller.x + this.unit * 0.4, this.scroller.y - this.scroller.headerHeight + this.unit * 0.42, this.unit * 0.55, this.unit * 0.55);
        }

        if (this.scroller.loading) {
            this.drawLoader(context, this.scroller.x + this.scroller.width * 0.5, this.scroller.y + this.scroller.height * 0.5, this.unit, true);
        }

        if (this.scroller.type === namespace.Pepper.ScrollerType.AddAsset) {
            if (!this.scroller.loading && !this.scroller.items.length) {
                if (namespace.Pepper.Resources.currentSponsor && namespace.Pepper.Resources.currentSponsor.image) {
                    const middleY = this.scroller.y + this.unit * 0.5;
                    const size = Math.min(this.numPadArea.width, this.numPadSendBtn.y - middleY - this.unit);
                    context.drawImage(namespace.Pepper.Resources.currentSponsor.image, this.numPadSendBtn.x + this.numPadSendBtn.width * 0.5 - size * 0.5, middleY, size, size);
                }
            }
        }

        context.restore();

        if (this.scroller.type === namespace.Pepper.ScrollerType.AddAsset) {
            context.save();
            context.fillStyle = namespace.Pepper.Resources.primaryColor;
            context.fillRect(this.viewport.x, this.closeScrollerBtn.y - this.closeScrollerBtn.height * 2, this.viewport.width, this.closeScrollerBtn.height * 3.3);
            this.roundRect(context, this.viewport.x + this.unit * 0.2, this.closeScrollerBtn.y + this.unit * 0.32, this.viewport.width - this.closeScrollerBtn.width * 1.1, this.closeScrollerBtn.height - this.unit * 0.25, this.unit * 0.5, "rgb(255, 255, 255)");
            context.save();
            if (this.closeScrollerBtn.hover || this.closeScrollerBtn.selected) {
                context.globalAlpha = 0.7 * context.globalAlpha;
            }
            context.drawImage(namespace.Pepper.Resources.closeImage, this.closeScrollerBtn.x, this.closeScrollerBtn.y + this.unit * 0.17, this.closeScrollerBtn.width, this.closeScrollerBtn.width);
            context.restore();

            context.globalAlpha = 0.7 * context.globalAlpha;
            context.drawImage(namespace.Pepper.Resources.searchImage, this.viewport.x + this.unit * 0.25, this.closeScrollerBtn.y + this.unit * 0.35, this.closeScrollerBtn.width * 0.7, this.closeScrollerBtn.width * 0.7);
            context.restore();
        }
    };

    // Draw the pin page.
    namespace.Pepper.View.prototype.drawPinPage = function (context) {
        let text;
        const fastTime = Math.max(0, this.startTime - 0.5);
        const fadeIn = Math.min(1, 1 - this.startTime);
        const margin = this.unit * 0.1;

        context.translate(this.pinMenuOffset * this.viewport.width * 0.7, 0);
        context.fillStyle = namespace.Pepper.Resources.primaryColor;
        this.roundRect(context, this.viewport.x - this.pinMenuOffset * this.viewport.width * 0.7, this.viewport.y - fastTime * this.unit * 15 - namespace.Pepper.barHeight, this.pinMenuOffset * this.viewport.width * 0.7 + this.viewport.width, this.pinCodeBtn.y + this.pinCodeBtn.height + this.unit * 0.1 + fastTime * this.unit * 15, this.unit * fastTime * 10, namespace.Pepper.Resources.primaryColor);

        // Draw the logo.
        context.save();
        let x = this.viewport.x + this.viewport.width * 0.5;
        let y = (this.pinCodeBtn.y - this.viewport.y) * 0.28 + namespace.Pepper.barHeight;
        context.translate(x, y);
        context.scale(fadeIn * 0.7, fadeIn * 0.7);
        context.rotate((1 - fadeIn) * Math.PI * 2);
        context.translate(-x, -y);
        context.globalAlpha = fadeIn * context.globalAlpha;
        if (!namespace.Pepper.importData) {
            context.drawImage(namespace.Pepper.Resources.logoSmallImage, x - this.unit, y - this.unit, this.unit * 2, this.unit * 2);
        }
        else {
            context.drawImage(namespace.Pepper.Resources.importImage, x - this.unit, y - this.unit, this.unit * 2, this.unit * 2);
        }
        context.restore();

        // Draw the logo tagline.
        context.save();
        context.globalAlpha = fadeIn * context.globalAlpha;
        if (this.page === namespace.Pepper.PageType.SignUp) {
            switch (namespace.Pepper.importType) {
                case 1:
                    this.drawText(context, this.numPadArea.x + this.numPadArea.width * 0.5, y + this.unit * 1.2,
                        namespace.Pepper.Resources.localeText[151] + namespace.Pepper.Tools.truncateKey(namespace.Pepper.importKey), "rgba(255, 255, 255," + fadeIn + ")", 0.82);
                    break;
                case 2:
                    this.drawText(context, this.numPadArea.x + this.numPadArea.width * 0.5, y + this.unit * 1.2,
                        namespace.Pepper.Resources.localeText[151] + namespace.Pepper.Tools.truncateKey(namespace.Pepper.importKey), "rgba(255, 255, 255," + fadeIn + ")", 0.82);
                    break;
                case 3:
                    this.drawText(context, this.numPadArea.x + this.numPadArea.width * 0.5, y + this.unit * 1.2,
                        namespace.Pepper.Resources.localeText[151] + namespace.Pepper.Tools.truncateKey(namespace.Pepper.importKey), "rgba(255, 255, 255," + fadeIn + ")", 0.82);
                    break;
                default:
                    this.drawText(context, this.numPadArea.x + this.numPadArea.width * 0.5, y + this.unit * 1.2,
                        namespace.Pepper.Resources.localeText[5], "rgba(255, 255, 255," + fadeIn + ")", 0.82);
                    break;
            }
        }
        else {
            this.drawText(context, this.numPadArea.x + this.numPadArea.width * 0.5 - (1 - fadeIn) * this.unit * 3, y + this.unit * 1.2, this.pinAccountName, "rgba(255, 255, 255," + fadeIn + ")", 0.9);
        }
        context.restore();

        // Draw the pin info area.
        context.save();
        if (this.pinError) {
            const trx = this.pinErrorTime * this.unit * this.pinBtn.heartBeats[0].time * 0.5;
            context.globalAlpha = (this.pinErrorTime > 0.7 ? (1 - this.pinErrorTime) * 3 : 1) * context.globalAlpha;
            context.translate(trx, 0);
            context.fillStyle = "rgb(219, 83, 101)";
            context.fillRect(this.numPadArea.x - trx, this.numPadArea.y - margin - this.unit * 0.9, this.numPadArea.width, this.unit * 0.8);
            this.drawText(context, this.numPadArea.x + this.numPadArea.width * 0.5, this.numPadArea.y - margin - this.unit * 0.5, namespace.Pepper.Resources.localeText[6], "rgb(255, 255, 255)", 0.85);
        }
        else if (this.page === namespace.Pepper.PageType.SignUp) {
            context.globalAlpha = (1 - this.pinMsgTime * 2) * context.globalAlpha;
            this.drawText(context, this.numPadArea.x + this.numPadArea.width * 0.5, this.numPadArea.y - margin - this.unit * 0.79, namespace.Pepper.Resources.localeText[7], "rgba(36, 41, 46, 0.6)", 0.63);
            this.drawText(context, this.numPadArea.x + this.numPadArea.width * 0.5, this.numPadArea.y - margin - this.unit * 0.34, namespace.Pepper.Resources.localeText[8], "rgba(36, 41, 46, 0.6)", 0.63);
        }
        context.restore();

        context.font = this.getFont("Roboto-Medium");
        const count = this.pinCode.length;
        if (count === 0) {
            text = this.page === namespace.Pepper.PageType.SignUp ? namespace.Pepper.Resources.localeText[0] : namespace.Pepper.Resources.localeText[1];
            if (this.pinStep === 1) {
                text = namespace.Pepper.Resources.localeText[2];
            }
            this.drawText(context, this.pinCodeBtn.x + this.numPadArea.width * 0.5, this.pinCodeBtn.y + this.pinCodeBtn.height * 0.5, text, "rgba(255, 255, 255, 0.5)", 1.35);
        }
        else {
            let strCode = "";
            for (let i = 0; i < count; i += 1) {
                strCode += ".";
            }
            this.drawText(context, this.pinCodeBtn.x + this.numPadArea.width * 0.5, this.pinCodeBtn.y + this.pinCodeBtn.height * 0.1, strCode, "rgb(255, 255, 255)", 4.3);
        }

        // Draw the numpad area.
        context.save();
        context.font = this.getFont("Roboto-Bold");
        for (let i = 0; i < this.numPad.length; i += 1) {
            const element = this.numPad[i];
            let color = "rgb(36, 41, 46)";
            const scale = 1.16;
            let alpha = 1;
            if (this.pinCode.length >= this.pinMax) {
                color = "rgba(36, 41, 46, 0.3)";
            }
            else if (element.selected) {
                color = "rgb(255, 255, 255)";
            }
            else if (element.hover) {
                color = "rgba(36, 41, 46, 0.5)";
                alpha = 0.5;
            }

            if ((this.pinCode.length < this.pinMax || element.id === 11) && (element.selected || element.selectTime)) {
                this.roundRect(context, element.x + margin, element.y + margin, element.width - margin * 2, element.height - margin * 2, this.unit * 0.1, "rgba(42, 193, 188, " + (element.selectTime ? element.selectTime * 0.5 : 0.5) + ")");
            }

            if (element.id < 11) {
                this.drawText(context, element.x + element.width * 0.5, element.y + element.height * 0.5, element.id.toString(), color, scale);
            }
            else if (element.id === 11) {
                context.save();
                context.globalAlpha = alpha;
                if (element.selected) {
                    context.drawImage(namespace.Pepper.Resources.backLightImage, element.x + element.width * 0.5 - element.height * 0.26, element.y + element.height * 0.25, element.height * 0.47, element.height * 0.47);
                }
                else {
                    context.drawImage(namespace.Pepper.Resources.backDarkImage, element.x + element.width * 0.5 - element.height * 0.26, element.y + element.height * 0.25, element.height * 0.47, element.height * 0.47);
                }
                context.restore();
            }
            else if (element.id === 12) {
                context.save();
                context.globalAlpha = alpha;
                if (element.selected) {
                    context.drawImage(namespace.Pepper.Resources.shuffleLightImage, element.x + element.width * 0.5 - element.height * 0.26, element.y + element.height * 0.25, element.height * 0.47, element.height * 0.47);
                }
                else {
                    context.drawImage(namespace.Pepper.Resources.shuffleDarkImage, element.x + element.width * 0.5 - element.height * 0.26, element.y + element.height * 0.25, element.height * 0.47, element.height * 0.47);
                }
                context.restore();
            }
        }
        context.restore();

        // Draw the pin button.
        context.save();
        text = namespace.Pepper.Resources.localeText[3];
        if (this.pinStep === 0) {
            text = this.page === namespace.Pepper.PageType.SignUp ? namespace.Pepper.Resources.localeText[4] : namespace.Pepper.Resources.localeText[3];
        }
        else if (this.pinStep === 1) {
            text = namespace.Pepper.Resources.localeText[3];
        }

        // Draw the menu button.
        if (this.pinMenuBtn.hover || this.pinMenuBtn.selected) {
            context.fillStyle = "rgba(255, 255, 255, 0.7)";
            context.fillRect(this.pinMenuBtn.x + this.unit * 0.25, this.pinMenuBtn.y + this.unit * 0.37, this.pinMenuBtn.width * 0.55, this.pinMenuBtn.height * 0.07);
            context.fillRect(this.pinMenuBtn.x + this.unit * 0.25, this.pinMenuBtn.y + this.unit * 0.55, this.pinMenuBtn.width * 0.55, this.pinMenuBtn.height * 0.07);
            context.fillRect(this.pinMenuBtn.x + this.unit * 0.25, this.pinMenuBtn.y + this.unit * 0.73, this.pinMenuBtn.width * 0.55, this.pinMenuBtn.height * 0.07);
        }
        else {
            context.fillStyle = "rgb(255, 255, 255)";
            context.fillRect(this.pinMenuBtn.x + this.unit * 0.25, this.pinMenuBtn.y + this.unit * 0.37, this.pinMenuBtn.width * 0.55, this.pinMenuBtn.height * 0.07);
            context.fillRect(this.pinMenuBtn.x + this.unit * 0.25, this.pinMenuBtn.y + this.unit * 0.55, this.pinMenuBtn.width * 0.55, this.pinMenuBtn.height * 0.07);
            context.fillRect(this.pinMenuBtn.x + this.unit * 0.25, this.pinMenuBtn.y + this.unit * 0.73, this.pinMenuBtn.width * 0.55, this.pinMenuBtn.height * 0.07);
        }

        // Draw the switch button.
        if (this.pinSwitchBtn.hover || this.pinSwitchBtn.selected) {
            context.drawImage(namespace.Pepper.Resources.switchDarkImage, this.pinSwitchBtn.x + this.pinSwitchBtn.height * 0.16, this.pinSwitchBtn.y + this.pinSwitchBtn.height * 0.15, this.pinSwitchBtn.width * 0.7, this.pinSwitchBtn.height * 0.7);
        }
        else {
            context.drawImage(namespace.Pepper.Resources.switchLightImage, this.pinSwitchBtn.x + this.pinSwitchBtn.height * 0.16, this.pinSwitchBtn.y + this.pinSwitchBtn.height * 0.15, this.pinSwitchBtn.width * 0.7, this.pinSwitchBtn.height * 0.7);
        }

        if (count < this.pinMin) {
            this.roundRect(context, this.pinBtn.x, this.pinBtn.y, this.pinBtn.width, this.pinBtn.height, this.pinBtn.height * 0.1, "rgba(42, 193, 188, 0.5)");
            context.font = this.getFont("Roboto-Medium");
            this.drawText(context, this.pinBtn.x + this.pinBtn.width * 0.5, this.pinBtn.y + this.pinBtn.height * 0.5, text, "rgba(255, 255, 255, 0.4)", 1);
        }
        else {
            let color = namespace.Pepper.Resources.primaryColor;
            let textColor = "rgb(255, 255, 255)";
            if (this.pinBtn.hover) {
                textColor = "rgba(255, 255, 255, 0.7)";
            }
            if (this.pinBtn.selected) {
                color = "rgb(41, 180, 200)";
            }

            this.roundRect(context, this.pinBtn.x, this.pinBtn.y, this.pinBtn.width, this.pinBtn.height, this.pinBtn.height * 0.1, color);

            if (!this.showPinLoader) {
                context.font = this.getFont("Roboto-Medium");
                this.drawText(context, this.pinBtn.x + this.pinBtn.width * 0.5, this.pinBtn.y + this.pinBtn.height * 0.5, text, textColor, 1);
            }
            else {
                this.drawLoader(context, this.pinBtn.x + this.pinBtn.width * 0.5, this.pinBtn.y + this.pinBtn.height * 0.5, this.pinBtn.height * 0.8);
            }
        }

        context.restore();

        context.translate(-(this.pinMenuOffset * this.viewport.width * 0.7), 0);
        if (this.pinMenuOffset) {
            // Shadow effect.
            context.save();
            context.globalAlpha = this.pinMenuOffset * context.globalAlpha;
            context.fillStyle = "rgba(0, 0, 0, 0.5)";
            context.fillRect(0, 0, this.width, this.height);
            context.restore();

            // Panel background.
            context.fillStyle = "rgb(255, 255, 255)";
            context.fillRect(this.pinMenuPanel.x, this.pinMenuPanel.y - namespace.Pepper.barHeight, this.pinMenuPanel.width, this.pinMenuPanel.height + namespace.Pepper.barHeight);

            context.fillStyle = namespace.Pepper.Resources.primaryColor;
            context.fillRect(this.pinMenuPanel.x, this.pinMenuPanel.y - namespace.Pepper.barHeight, this.pinMenuPanel.width, this.unit * 2.4 + namespace.Pepper.barHeight);

            x = this.pinMenuPanel.x + this.pinMenuPanel.width - this.viewport.width * 0.8;

            if (namespace.Pepper.networkMessage !== namespace.config.version && namespace.Pepper.networkMessage !== "") {
                context.textAlign = "center";
                context.font = this.getFont("Roboto-Light");
                context.fillStyle = "rgb(36, 41, 46)";
                context.fillRect(this.pinMenuPanel.x + this.unit * 2.5, this.pinMenuPanel.y + this.unit * 1.6, this.pinMenuPanel.width - this.unit * 2.7, this.unit * 0.6);
                this.drawText(context, this.pinMenuPanel.x + this.unit * 2.5 + (this.pinMenuPanel.width - this.unit * 2.7) * 0.5, this.pinMenuPanel.y + this.unit * 1.9, namespace.Pepper.networkMessage, namespace.Pepper.Resources.primaryColor, 0.65);
            }
            else {
                context.textAlign = "right";
                context.font = this.getFont("Roboto-Regular");
                this.drawText(context, this.pinMenuPanel.x + this.unit * 2.5 + (this.pinMenuPanel.width - this.unit * 2.7) - this.unit * 0.2, this.pinMenuPanel.y + this.unit * 1.9, "v" + namespace.Pepper.networkMessage, "rgba(255,255,255,0.7)", 0.72);
            }

            // Content.
            context.save();
            context.globalAlpha = this.pinMenuOffset * context.globalAlpha;
            context.fillStyle = "rgba(255, 255, 255, 0.17)";
            context.fillRect(x, this.pinMenuPanel.y + this.unit * 2.4, this.viewport.width * 0.8, this.unit * 0.02);

            context.textAlign = "left";
            context.font = this.getFont("Roboto-Bold");
            this.drawText(context, x + this.unit * 0.6, this.pinMenuPanel.y + this.unit * 0.7, namespace.Pepper.Resources.localeText[9], "rgb(255, 255, 255)", 0.9);
            context.drawImage(namespace.Pepper.Resources.arrowRightImage, x + this.viewport.width * 0.8 - this.unit, this.pinMenuPanel.y + this.unit * 0.44, this.unit * 0.55, this.unit * 0.55);

            context.font = this.getFont("Roboto-Medium");
            for (let i = 0; i < this.pinMenu.length; i += 1) {
                const element = this.pinMenu[i];

                context.fillStyle = element.hover || element.selected ? "rgba(36, 41, 46, 0.07)" : "rgba(0, 0, 0, 0)";
                context.fillRect(element.x, element.y, element.width, element.height);

                switch (element.id) {
                    case 0:
                        context.drawImage(namespace.Pepper.Resources.peopleImage, element.x + element.height * 0.6, element.y + element.height * 0.26, element.height * 0.43, element.height * 0.43);
                        this.drawText(context, element.x + element.height * 1.4, element.y + element.height * 0.5, namespace.Pepper.Resources.localeText[10], "rgb(36, 41, 46)", 0.8);
                        break;
                    case 1:
                        context.drawImage(namespace.Pepper.Resources.personImage, element.x + element.height * 0.6, element.y + element.height * 0.26, element.height * 0.43, element.height * 0.43);
                        this.drawText(context, element.x + element.height * 1.4, element.y + element.height * 0.5, namespace.Pepper.Resources.localeText[11], "rgb(36, 41, 46)", 0.8);
                        break;
                    case 2:
                        context.drawImage(namespace.Pepper.Resources.walletImage, element.x + element.height * 0.6, element.y + element.height * 0.26, element.height * 0.43, element.height * 0.43);
                        this.drawText(context, element.x + element.height * 1.4, element.y + element.height * 0.5, namespace.Pepper.Resources.localeText[12], "rgb(36, 41, 46)", 0.8);
                        break;
                    case 3:
                        context.fillStyle = "rgba(36, 41, 46, 0.16)";
                        context.fillRect(element.x, element.y, element.width, element.height * 0.016);
                        context.drawImage(namespace.Pepper.Resources.globeImage, element.x + element.height * 0.6, element.y + element.height * 0.26, element.height * 0.43, element.height * 0.43);
                        this.drawText(context, element.x + element.height * 1.4, element.y + element.height * 0.5, namespace.Pepper.Resources.localeText[13], "rgb(36, 41, 46)", 0.8);
                        break;
                    case 4:
                        context.drawImage(namespace.Pepper.Resources.questionImage, element.x + element.height * 0.6, element.y + element.height * 0.26, element.height * 0.43, element.height * 0.43);
                        this.drawText(context, element.x + element.height * 1.4, element.y + element.height * 0.5, namespace.Pepper.Resources.localeText[14], "rgb(36, 41, 46)", 0.8);
                        break;
                }
            }
            context.restore();
        }
    };

    // Draw the dashboard.
    namespace.Pepper.View.prototype.drawDashboard = function (context) {
        let radius;

        context.translate(this.dashboardMenuOffset * this.viewport.width * 0.7, 0);

        this.drawList(context);
        this.drawTabs(context);
        this.drawCarousel(context);

        // Draw the menu button.
        context.save();
        if (this.menuBtn.hover || this.menuBtn.selected) {
            context.fillStyle = "rgba(255, 255, 255, 0.7)";
            context.fillRect(this.menuBtn.x + this.unit * 0.25, this.menuBtn.y + this.unit * 0.37, this.menuBtn.width * 0.55, this.menuBtn.height * 0.07);
            context.fillRect(this.menuBtn.x + this.unit * 0.25, this.menuBtn.y + this.unit * 0.55, this.menuBtn.width * 0.55, this.menuBtn.height * 0.07);
            context.fillRect(this.menuBtn.x + this.unit * 0.25, this.menuBtn.y + this.unit * 0.73, this.menuBtn.width * 0.55, this.menuBtn.height * 0.07);
        }
        else {
            context.fillStyle = "rgb(255, 255, 255)";
            context.fillRect(this.menuBtn.x + this.unit * 0.25, this.menuBtn.y + this.unit * 0.37, this.menuBtn.width * 0.55, this.menuBtn.height * 0.07);
            context.fillRect(this.menuBtn.x + this.unit * 0.25, this.menuBtn.y + this.unit * 0.55, this.menuBtn.width * 0.55, this.menuBtn.height * 0.07);
            context.fillRect(this.menuBtn.x + this.unit * 0.25, this.menuBtn.y + this.unit * 0.73, this.menuBtn.width * 0.55, this.menuBtn.height * 0.07);
        }
        context.restore();

        context.save();
        if (this.accountBtn.hover || this.accountBtn.selected) {
            context.globalAlpha = 0.7 * context.globalAlpha;
        }
        context.drawImage(namespace.Pepper.Resources.accountImage, this.accountBtn.x, this.accountBtn.y, this.accountBtn.width, this.accountBtn.width);
        context.restore();

        if (!this.account.backup && !namespace.Core.currentAccount.nobackup) {
            context.drawImage(namespace.Pepper.Resources.warningImage, this.accountBtn.x + this.accountBtn.width * 0.5, this.accountBtn.y, this.accountBtn.width * 0.6, this.accountBtn.width * 0.6);
        }

        if (this.isSendMode || this.sendFormEndTime) {
            this.drawNumPad(context);
        }

        context.save();
        context.translate(0, this.dashboardTime * this.unit * 3);

        if (this.sendFormEndTime || this.sendFormTime || !this.isSendMode) {
            context.save();

            if (this.sendFormTime && this.isSendMode) {
                context.translate(0, (0.5 - this.sendFormTime) * this.unit * 3);
            }

            if (this.sendFormEndTime && !this.isSendMode) {
                context.translate(0, this.sendFormEndTime * this.unit * 3);
            }

            context.font = this.getFont("Roboto-Regular");
            context.fillStyle = "rgb(255, 255, 255)";
            context.fillRect(this.viewport.x, this.sendBtn.y - this.unit * 0.2, this.viewport.width, this.unit * 3);
            context.fillStyle = "rgba(36, 41, 46, 0.16)";
            context.fillRect(this.viewport.x, this.sendBtn.y - this.unit * 0.2, this.viewport.width, this.unit * 0.02);

            if (!namespace.Core.currentAccount.watchOnly) {
                context.save();
                radius = this.sendBtn.width * 0.5 * (this.sendBtn.selected ? 0.95 : 1) * (1 - this.dashboardTime * 2);
                this.circle(context, this.sendBtn.x + this.sendBtn.width * 0.5, this.sendBtn.y + this.sendBtn.height * 0.5, radius, "rgb(50, 47, 66)");
                context.globalAlpha = (this.sendBtn.hover ? 0.7 : 1) * context.globalAlpha;
                context.drawImage(namespace.Pepper.Resources.sendImage, this.sendBtn.x + this.sendBtn.width * 0.5 - radius, this.sendBtn.y + this.sendBtn.height * 0.5 - radius, radius * 2, radius * 2);
                context.restore();
            }

            context.save();
            radius = this.receiveBtn.width * 0.5 * (this.receiveBtn.selected ? 0.9 : 1) * (1 - this.dashboardTime * 2);
            this.circle(context, this.receiveBtn.x + this.receiveBtn.width * 0.5, this.receiveBtn.y + this.receiveBtn.height * 0.5, radius, "rgb(50, 47, 66)");
            context.globalAlpha = (this.receiveBtn.hover ? 0.7 : 1) * context.globalAlpha;
            if (namespace.Core.currentAccount.watchOnly) {
                context.drawImage(namespace.Pepper.Resources.watchImage, this.receiveBtn.x + this.receiveBtn.width * 0.5 - radius, this.receiveBtn.y + this.receiveBtn.height * 0.5 - radius, radius * 2, radius * 2);
            }
            else {
                context.drawImage(namespace.Pepper.Resources.receiveImage, this.receiveBtn.x + this.receiveBtn.width * 0.5 - radius, this.receiveBtn.y + this.receiveBtn.height * 0.5 - radius, radius * 2, radius * 2);
            }
            context.restore();

            if (!namespace.Core.currentAccount.watchOnly) {
                context.save();
                radius = this.tradeBtn.width * 0.5 * (this.tradeBtn.selected ? 0.9 : 1) * (1 - this.dashboardTime * 2);
                this.circle(context, this.tradeBtn.x + this.tradeBtn.width * 0.5, this.tradeBtn.y + this.tradeBtn.height * 0.5, radius, "rgb(50, 47, 66)");
                context.globalAlpha = (this.tradeBtn.hover ? 0.7 : 1) * context.globalAlpha;
                context.drawImage(namespace.Pepper.Resources.marketImage, this.tradeBtn.x + this.tradeBtn.width * 0.5 - radius, this.tradeBtn.y + this.tradeBtn.height * 0.5 - radius, radius * 2, radius * 2);
                context.restore();
            }

            context.textAlign = "center";
            if (!namespace.Core.currentAccount.watchOnly) {
                this.drawText(context, this.sendBtn.x + this.sendBtn.width * 0.5, this.sendBtn.y + this.sendBtn.height * 1.165, namespace.Pepper.Resources.localeText[44], "rgb(50, 47, 66)", 0.6);
            }
            if (namespace.Core.currentAccount.watchOnly) {
                this.drawText(context, this.receiveBtn.x + this.receiveBtn.width * 0.5, this.receiveBtn.y + this.receiveBtn.height * 1.165, namespace.Pepper.Resources.localeText[118], "rgb(50, 47, 66)", 0.6);
            }
            else {
                this.drawText(context, this.receiveBtn.x + this.receiveBtn.width * 0.5, this.receiveBtn.y + this.receiveBtn.height * 1.165, namespace.Pepper.Resources.localeText[45], "rgb(50, 47, 66)", 0.6);
            }
            if (!namespace.Core.currentAccount.watchOnly) {
                this.drawText(context, this.tradeBtn.x + this.tradeBtn.width * 0.5, this.tradeBtn.y + this.tradeBtn.height * 1.165, namespace.Pepper.Resources.localeText[157], "rgb(50, 47, 66)", 0.6);
            }

            context.restore();
        }

        context.restore();

        if (this.error === namespace.Pepper.ViewErrorType.AccountNotCreated
            && !this.isSendMode
            && this.tabId === 0
            && !namespace.Core.currentAccount.watchOnly) {
            context.save();
            context.globalAlpha = 1 - this.list.startTime * 2;
            context.translate(this.dashboardTime * this.unit * 1, -this.dashboardTime * this.unit * 3);
            context.drawImage(namespace.Pepper.Resources.receiveArrowImage,
                this.receiveBtn.x + this.receiveBtn.width + this.unit * 0.1, 
                this.receiveBtn.y - this.receiveBtn.width * 1.2,
                this.receiveBtn.width * 0.8, this.receiveBtn.width * 1.6);

            context.textAlign = "right";
            this.drawText(context, this.receiveBtn.x + this.receiveBtn.width * 1.1, this.receiveBtn.y - this.receiveBtn.height * 1.25, namespace.Pepper.Resources.localeText[106], "rgb(50, 47, 66)", 0.72);
            this.drawText(context, this.receiveBtn.x + this.receiveBtn.width * 1.1, this.receiveBtn.y - this.receiveBtn.height * 0.83, namespace.Pepper.Resources.localeText[107], "rgb(50, 47, 66)", 0.72);
            context.restore();
        }

        context.translate(-(this.dashboardMenuOffset * this.viewport.width * 0.7), 0);

        if (this.dashboardMenuOffset) {
            // Shadow effect.
            context.save();
            context.globalAlpha = this.dashboardMenuOffset * context.globalAlpha;
            context.fillStyle = "rgba(0, 0, 0, 0.5)";
            context.fillRect(0, 0, this.width, this.height);
            context.restore();

            // Panel background.
            context.fillStyle = "rgb(255, 255, 255)";
            context.fillRect(this.dashboardMenuPanel.x, this.dashboardMenuPanel.y - namespace.Pepper.barHeight, this.dashboardMenuPanel.width, this.dashboardMenuPanel.height + namespace.Pepper.barHeight);

            context.fillStyle = namespace.Pepper.Resources.primaryColor;
            context.fillRect(this.dashboardMenuPanel.x, this.dashboardMenuPanel.y - namespace.Pepper.barHeight, this.dashboardMenuPanel.width, this.unit * 2.4 + namespace.Pepper.barHeight);

            const x = this.dashboardMenuPanel.x + this.dashboardMenuPanel.width - this.viewport.width * 0.8;

            if (namespace.Pepper.networkMessage !== namespace.config.version && namespace.Pepper.networkMessage !== "") {
                context.textAlign = "center";
                context.font = this.getFont("Roboto-Light");
                context.fillStyle = "rgb(36, 41, 46)";
                context.fillRect(this.dashboardMenuPanel.x + this.unit * 2.5, this.dashboardMenuPanel.y + this.unit * 1.6, this.dashboardMenuPanel.width - this.unit * 2.7, this.unit * 0.6);
                this.drawText(context, this.dashboardMenuPanel.x + this.unit * 2.5 + (this.dashboardMenuPanel.width - this.unit * 2.7) * 0.5, this.dashboardMenuPanel.y + this.unit * 1.9, namespace.Pepper.networkMessage, namespace.Pepper.Resources.primaryColor, 0.65);
            }
            else {
                context.textAlign = "right";
                context.font = this.getFont("Roboto-Regular");
                this.drawText(context, this.dashboardMenuPanel.x + this.unit * 2.5 + (this.dashboardMenuPanel.width - this.unit * 2.7) - this.unit * 0.2, this.dashboardMenuPanel.y + this.unit * 1.9, "v" + namespace.Pepper.networkMessage, "rgba(255,255,255,0.7)", 0.72);
            }

            // Content.
            context.save();
            context.globalAlpha = this.dashboardMenuOffset * context.globalAlpha;
            context.fillStyle = "rgba(255, 255, 255, 0.17)";
            context.fillRect(x, this.dashboardMenuPanel.y + this.unit * 2.4, this.viewport.width * 0.8, this.unit * 0.02);

            context.textAlign = "left";
            context.font = this.getFont("Roboto-Bold");
            this.drawText(context, x + this.unit * 0.6, this.dashboardMenuPanel.y + this.unit * 0.7, this.account.name, "rgb(255, 255, 255)", 0.9);
            //context.drawImage(namespace.Pepper.Resources.arrowRightImage, x + this.viewport.width * 0.8 - this.unit, this.dashboardMenuPanel.y + this.unit * 0.44, this.unit * 0.55, this.unit * 0.55);

            context.font = this.getFont("Roboto-Medium");
            for (let i = 0; i < this.dashboardMenu.length; i += 1) {
                const element = this.dashboardMenu[i];

                context.fillStyle = element.hover || element.selected ? "rgba(36, 41, 46, 0.07)" : "rgba(0, 0, 0, 0)";
                context.fillRect(element.x, element.y, element.width, element.height);

                switch (element.id) {
                    case 0:
                        context.drawImage(namespace.Pepper.Resources.manageImage, element.x + element.height * 0.6, element.y + element.height * 0.26, element.height * 0.43, element.height * 0.43);
                        this.drawText(context, element.x + element.height * 1.4, element.y + element.height * 0.5, namespace.Pepper.Resources.localeText[91], "rgb(36, 41, 46)", 0.8);
                        break;
                    case 1:
                        context.fillStyle = "rgba(36, 41, 46, 0.16)";
                        context.fillRect(element.x, element.y, element.width, element.height * 0.016);
                        context.drawImage(namespace.Pepper.Resources.globeImage, element.x + element.height * 0.6, element.y + element.height * 0.26, element.height * 0.43, element.height * 0.43);
                        this.drawText(context, element.x + element.height * 1.4, element.y + element.height * 0.5, namespace.Pepper.Resources.localeText[13], "rgb(36, 41, 46)", 0.8);
                        break;
                    case 2:
                        context.drawImage(namespace.Pepper.Resources.questionImage, element.x + element.height * 0.6, element.y + element.height * 0.26, element.height * 0.43, element.height * 0.43);
                        this.drawText(context, element.x + element.height * 1.4, element.y + element.height * 0.5, namespace.Pepper.Resources.localeText[14], "rgb(36, 41, 46)", 0.8);
                        break;
                    case 3:
                        context.fillStyle = "rgba(36, 41, 46, 0.16)";
                        context.fillRect(element.x, element.y, element.width, element.height * 0.016);
                        context.drawImage(namespace.Pepper.Resources.walletImage, element.x + element.height * 0.6, element.y + element.height * 0.26, element.height * 0.43, element.height * 0.43);
                        this.drawText(context, element.x + element.height * 1.4, element.y + element.height * 0.5, namespace.Pepper.Resources.localeText[90], "rgb(36, 41, 46)", 0.8);
                        break;
                }
            }

            context.restore();
        }
    };

    // Draw the carousel.
    namespace.Pepper.View.prototype.drawCarousel = function (context) {
        let corner = 0;

        context.save();
        context.translate(0, -this.dashboardTime * this.carousel.height * 2);

        context.save();
        context.save();
        context.fillStyle = namespace.Pepper.Resources.primaryColor;
        context.fillRect(this.carousel.x - this.unit * 5, this.carousel.y - this.carousel.headerHeight - namespace.Pepper.barHeight, this.carousel.width + this.unit * 5, this.carousel.height + this.unit * 0.5 + this.carousel.headerHeight + namespace.Pepper.barHeight);
        if (!this.isSendMode) {
            const alpha = this.sendFormEndTime * 2 * context.globalAlpha;
            if (alpha) {
                context.fillStyle = "rgba(0, 0, 0," + alpha * 0.15 + ")";
                context.fillRect(this.carousel.x, this.carousel.y - this.carousel.headerHeight - namespace.Pepper.barHeight, this.carousel.width, this.carousel.height + this.unit * 0.5 + this.carousel.headerHeight + namespace.Pepper.barHeight);
            }
        }
        else {
            const alpha = 1 - this.sendFormOffset / (this.unit * 2) / 2;
            if (alpha) {
                context.fillStyle = "rgba(0, 0, 0," + alpha * 0.15 + ")";
                context.fillRect(this.carousel.x, this.carousel.y - this.carousel.headerHeight - namespace.Pepper.barHeight, this.carousel.width, this.carousel.height + this.unit * 0.5 + this.carousel.headerHeight + namespace.Pepper.barHeight);
            }
        }
        context.restore();

        if (!this.dashboardTime) {
            corner = this.carouselItem.heartBeats[0].time * this.carouselItem.selectTime * 0.41;
        }

        this.triangle(context, this.carousel.x + this.carousel.width * 0.5, namespace.Pepper.barHeight + this.carousel.headerHeight * 0.75 - corner * this.unit, this.unit * 0.45,
            this.assetPicker.hover || this.assetPicker.selected ? "rgb(255,255,255)" : "rgb(255,221, 87)", true);

        context.translate(-this.carousel.offset, 0);
        if (this.carousel.items.length > 0) {
            for (let i = 0; i < this.carousel.items.length; i += 1) {
                this.drawCarouselItem(context, i, corner);
            }
        }
        else {
            this.drawCarouselItem(context, -1, corner);
        }

        context.restore();

        context.save();
        context.globalAlpha = (1 - this.carouselItem.selectTime * 2) * context.globalAlpha;
        context.font = this.getFont("Roboto-Regular");
        if (this.scroller.type === namespace.Pepper.ScrollerType.Currencies && this.showScroller) {
            this.drawText(context, this.viewport.x + this.viewport.width * 0.5 + (this.carousel.direction ? -this.carouselItem.selectTime : this.carouselItem.selectTime) * this.unit * 0.5, this.viewport.y + this.unit * 0.5, namespace.Pepper.Resources.localeText[147], "rgb(255, 255, 255)", 0.9);
        }
        else if (this.carousel.items.length) {
            if (this.scroller.type === namespace.Pepper.ScrollerType.Assets && this.showScroller) {
                this.drawText(context, this.viewport.x + this.viewport.width * 0.5 + (this.carousel.direction ? -this.carouselItem.selectTime : this.carouselItem.selectTime) * this.unit * 0.5, this.viewport.y + this.unit * 0.5, namespace.Pepper.Resources.localeText[76], "rgb(255, 255, 255)", 0.9);
            }
            else {
                this.drawText(context, this.viewport.x + this.viewport.width * 0.5 + (this.carousel.direction ? -this.carouselItem.selectTime : this.carouselItem.selectTime) * this.unit * 0.5, this.viewport.y + this.unit * 0.5, this.carousel.items[this.carousel.active].asset.name, "rgb(255, 255, 255)", 0.9);
            }
        }
        else if (this.placeHolderAsset) {
            if (this.scroller.type === namespace.Pepper.ScrollerType.Assets && this.showScroller) {
                this.drawText(context, this.viewport.x + this.viewport.width * 0.5, this.viewport.y + this.unit * 0.5, namespace.Pepper.Resources.localeText[76], "rgb(255, 255, 255)", 0.9);
            }
            else {
                this.drawText(context, this.viewport.x + this.viewport.width * 0.5, this.viewport.y + this.unit * 0.5, this.placeHolderAsset.asset.name, "rgb(255, 255, 255)", 0.9);
            }
        }
        else {
            this.drawText(context, this.viewport.x + this.viewport.width * 0.5 + (this.carousel.direction ? -this.carouselItem.selectTime : this.carouselItem.selectTime) * this.unit * 0.5, this.viewport.y + this.unit * 0.5, namespace.Pepper.Resources.localeText[41], "rgb(255, 255, 255)", 0.9);
        }
        context.restore();

        context.restore();
    };

    // Draw carousel item.
    namespace.Pepper.View.prototype.drawCarouselItem = function (context, index, corner) {
        let item;
        if (index >= 0 && index < this.carousel.items.length) {
            item = this.carousel.items[index];
        }
        else {
            item = this.placeHolderAsset;
        }

        if (item.x - this.carousel.offset + item.width > this.carousel.x
            && item.x - this.carousel.offset - item.width < this.carousel.x + this.carousel.width) {

            context.save();

            context.globalAlpha = (1 - item.transitionTime * 2) * context.globalAlpha;

            context.fillStyle = "rgb(255, 255, 255)";
            if (this.carousel.active === index) {
                context.translate(item.x + item.width * 0.5, item.y + item.height * 0.5);
                context.scale(1 + corner * 0.2, 1 + corner * 0.2);
                context.translate(-(item.x + item.width * 0.5), -(item.y + item.height * 0.5));

                context.save();
                if (corner) {
                    context.shadowColor = "rgba(0, 0, 0, 0.3)";
                    context.shadowBlur = this.unit * 0.07 + corner * this.unit * 2.5;
                }
                this.roundRect(context, item.x + this.unit * 0.1, item.y, item.width - this.unit * 0.2, item.height, this.unit * 0.2 + corner, namespace.Pepper.Resources.primaryColor, true, "rgba(0, 0, 0, 0.2)");
                context.restore();

                if (this.isSendMode && this.sendStep !== 0 && this.sendStep !== 5 && this.sendStep !== 6) {
                    this.roundRect(context, item.x + this.unit * 0.1, item.y, item.width - this.unit * 0.2, item.height, this.unit * 0.2 + corner, "rgba(0, 0, 0, 0.2)");
                }
                else if (item.chartMode) {
                    this.roundRect(context, item.x + this.unit * 0.1, item.y, item.width - this.unit * 0.2, item.height, this.unit * 0.2 + corner, "rgba(50, 47, 66, 1)");
                }
            }
            else {
                context.save();
                this.roundRect(context, item.x + this.unit * 0.1, item.y, item.width - this.unit * 0.2, item.height, this.unit * 0.2, namespace.Pepper.Resources.primaryColor, true, "rgba(0, 0, 0, 0.2)");
                context.restore();

                if (this.isSendMode && this.sendStep !== 0 && this.sendStep !== 5 && this.sendStep !== 6) {
                    this.roundRect(context, item.x + this.unit * 0.1, item.y, item.width - this.unit * 0.2, item.height, this.unit * 0.2 + corner, "rgba(0, 0, 0, 0.2)");
                }
                else if (item.chartMode) {
                    this.roundRect(context, item.x + this.unit * 0.1, item.y, item.width - this.unit * 0.2, item.height, this.unit * 0.2 + corner, "rgba(50, 47, 66, 1)");
                }
            }

            if (!item.asset.loaded) {
                this.drawLoader(context, item.x + item.width * 0.5, item.y + item.height * 0.5, this.unit);
            }
            else {
                if (!item.chartMode) {
                    context.font = this.getFont("Roboto-Light");
                    context.textAlign = "right";
                    let extent = Math.max(this.unit * 1.5, context.measureText(item.asset.domain).width * 0.72) + this.unit * 1.2;
                    this.roundRect(context, item.x + item.width - extent - this.unit * 0.2, item.y + item.height - this.unit * 1.1, extent, this.unit * 1, this.unit * 0.18, "rgba(0,0,0, 0.15)");

                    if (!this.isSendMode) {
                        context.save();

                        context.globalAlpha = 1 - this.sendFormEndTime * 2 * context.globalAlpha;

                        context.textAlign = "center";
                        context.font = this.getFont("Roboto-Regular");
                        this.drawText(context, item.x + item.width * 0.5, item.y + this.unit * 0.8, namespace.Pepper.Resources.localeText[40], "rgba(255, 255, 255, 0.7)", 0.8);

                        context.font = this.getFont("Roboto-Light");
                        this.drawText(context, item.x + item.width * 0.5, item.y + this.unit * 1.7, item.asset.code, "rgb(255, 255, 255)", 1);

                        if (this.error !== namespace.Pepper.ViewErrorType.AccountNotAvailable) {
                            context.font = this.getFont("Roboto-Black");
                            this.drawText(context, item.x + item.width * 0.5, item.y + this.unit * 2.5, namespace.Pepper.Tools.formatPrice(item.asset.balance, item.asset.decimals), "rgb(255, 255, 255)", 1.5);

                            let currencyrate = namespace.Pepper.MarketData.rates[item.asset.code];
                            let accountCurrencyRate = namespace.Pepper.MarketData.rates[this.account.currency];
                            if (currencyrate && currencyrate.rate && !isNaN(currencyrate.rate) && Number(currencyrate.rate) > 0 && accountCurrencyRate) {
                                let currencyPrice = 1 / currencyrate.rate * accountCurrencyRate.rate;
                                context.font = this.getFont("Roboto-Regular");
                                this.drawText(context, item.x + item.width * 0.5, item.y + this.unit * 3.3,
                                    "(" + this.account.currency + " "
                                    + namespace.Pepper.Tools.formatPrice(item.asset.balance * currencyPrice, accountCurrencyRate.precision) + ")", "rgb(255, 255, 255)", 0.8);
                            }
                        }
                        else {
                            this.drawLoader(context, item.x + item.width * 0.5, item.y + item.height * 0.55, this.unit);
                        }

                        context.restore();

                    }
                    else if (this.sendStep === 0 || this.sendStep === 5 || this.sendStep === 6) {
                        context.save();
                        const scale = 1 - this.sendFormOffset / (this.unit * 2) / 2;
                        context.globalAlpha = context.globalAlpha * scale;
                        context.textAlign = "left";
                        context.font = this.getFont("Roboto-Regular");
                        this.drawText(context, item.x + this.unit * 1.8 + this.sendFormOffset * 0.5, item.y + this.unit * 0.15 + this.sendFormOffset * 0.05 + this.unit * 0.3, namespace.Pepper.Resources.localeText[56], "rgba(255, 255, 255, 0.7)", 0.75);

                        if (this.error !== namespace.Pepper.ViewErrorType.AccountNotAvailable) {
                            this.drawText(context, item.x + this.unit * 0.5 + this.sendFormOffset * 0.5, item.y + this.unit * 2.1, namespace.Pepper.Resources.localeText[49], "rgba(255, 255, 255, 0.7)", 0.65);
                            context.font = this.getFont("Roboto-Medium");
                            this.drawText(context, item.x + this.unit * 1.8 + this.sendFormOffset * 0.5, item.y + this.unit * 0.5 + this.unit * 0.48, item.asset.code + " " + namespace.Pepper.Tools.formatPrice(namespace.Core.currentAccount.getMaxSend(item.asset.balance, !this.carousel.active), item.asset.decimals), "rgb(255, 255, 255)", 0.95 * scale);
                            context.textAlign = "left";
                            context.font = this.getFont("Roboto-Regular");
                            extent = context.measureText(namespace.Pepper.Resources.localeText[49]).width * 0.65;
                            this.drawText(context, item.x + extent + this.unit * 0.7, item.y + this.unit * 2.1, item.asset.code + " " + namespace.Pepper.Tools.formatPrice(namespace.Core.currentAccount.getReserve(!this.carousel.active), item.asset.decimals), "rgb(255, 255, 255)", 0.65 * scale);
                        }
                        else {
                            this.drawLoader(context, item.x + item.width * 0.5, item.y + item.height * 0.5, this.unit);
                        }
                        context.restore();
                    }
                    else {
                        context.save();
                        const scale = 1 - this.sendFormOffset / (this.unit * 2) / 2;
                        context.globalAlpha = context.globalAlpha * scale;
                        context.textAlign = "left";
                        context.font = this.getFont("Roboto-Regular");
                        this.drawText(context, item.x + this.unit * 1.8 + this.sendFormOffset * 0.5, item.y + this.unit * 0.15 + this.sendFormOffset * 0.05 + this.unit * 0.3, namespace.Pepper.Resources.localeText[57], "rgba(255, 255, 255, 0.7)", 0.75);
                        this.drawText(context, item.x + this.unit * 0.5 + this.sendFormOffset * 0.5, item.y + this.unit * 2.1, namespace.Pepper.Resources.localeText[58], "rgba(255, 255, 255, 0.7)", 0.65);
                        context.font = this.getFont("Roboto-Medium");
                        this.drawText(context, item.x + this.unit * 1.8 + this.sendFormOffset * 0.5, item.y + this.unit * 0.5 + this.unit * 0.48, item.asset.code + " " + namespace.Pepper.Tools.formatPrice(this.sendAmount, item.asset.decimals), "rgb(255, 255, 255)", 0.95 * scale);
                        context.textAlign = "left";
                        context.font = this.getFont("Roboto-Regular");
                        extent = context.measureText(namespace.Pepper.Resources.localeText[58]).width * 0.65;
                        this.drawText(context, item.x + extent + this.unit * 0.7, item.y + this.unit * 2.1, "XLM " + namespace.Pepper.Tools.formatPrice(namespace.Core.currentAccount.getBaseFee()), "rgb(255, 255, 255)", 0.65 * scale);
                        context.restore();
                    }

                    context.font = this.getFont("Roboto-Light");
                    context.textAlign = "right";
                    this.drawText(context, item.x + item.width - this.unit * 1.2, item.y + item.height - this.unit * 0.81, item.asset.domain, "rgb(255, 255, 255)", 0.72);

                    if (item.asset.deposit) {
                        this.drawText(context, item.x + item.width - this.unit * 1.2, item.y + item.height - this.unit * 0.39, namespace.Pepper.Resources.localeText[42], "rgb(182, 252, 85)", 0.6);
                        context.drawImage(namespace.Pepper.Resources.seamlessImage, item.x + item.width - this.unit, item.y + item.height - this.unit * 0.95, this.unit * 0.7, this.unit * 0.7);
                    }
                    else if (item.asset.verified) {
                        this.drawText(context, item.x + item.width - this.unit * 1.2, item.y + item.height - this.unit * 0.39, namespace.Pepper.Resources.localeText[42], "rgb(182, 252, 85)", 0.6);
                        context.drawImage(namespace.Pepper.Resources.shieldImage, item.x + item.width - this.unit, item.y + item.height - this.unit * 0.95, this.unit * 0.7, this.unit * 0.7);
                    }
                    else {
                        this.drawText(context, item.x + item.width - this.unit * 1.2, item.y + item.height - this.unit * 0.39, namespace.Pepper.Resources.localeText[43], "rgb(255, 30, 55)", 0.6);
                        context.drawImage(namespace.Pepper.Resources.warningImage, item.x + item.width - this.unit, item.y + item.height - this.unit * 0.95, this.unit * 0.7, this.unit * 0.7);
                    }

                    if (item.asset.validImage) {
                        context.drawImage(item.asset.image, item.x + this.unit * 0.3, item.y + this.unit * 0.2, this.unit * 1.25, this.unit * 1.25);
                    }
                    else if (item.asset.code === "XLM") {
                        context.drawImage(namespace.Pepper.Resources.stellarImage, item.x + this.unit * 0.3, item.y + this.unit * 0.2, this.unit * 1.25, this.unit * 1.25);
                    }

                    if (!this.isSendMode) {
                        context.save();
                        if (this.carousel.active === index && (this.chartBtn.hover || this.chartBtn.selected)) {
                            context.globalAlpha = 0.7 * context.globalAlpha;
                        }
                        context.drawImage(namespace.Pepper.Resources.chartImage, item.x + this.unit * 0.2, item.y + item.height - this.unit * 1.1, this.unit, this.unit);
                        context.restore();
                    }

                    if (!this.isSendMode) {
                        context.save();
                        if (this.carousel.active === index && (this.moreBtn.hover || this.moreBtn.selected)) {
                            context.globalAlpha = 0.7 * context.globalAlpha;
                        }
                        context.drawImage(namespace.Pepper.Resources.moreImage, item.x + item.width - this.unit * 1.2, item.y + this.unit * 0.1, this.unit, this.unit);
                        context.restore();
                    }
                }
                else {
                    context.save();
                    if (this.carousel.active === index && (this.moreBtn.hover || this.moreBtn.selected)) {
                        context.globalAlpha = 0.7 * context.globalAlpha;
                    }
                    context.drawImage(namespace.Pepper.Resources.closeImage, item.x + item.width - this.unit * 1.2, item.y + this.unit * 0.1, this.unit, this.unit);
                    context.restore();

                    context.font = this.getFont("Roboto-Medium");
                    context.textAlign = "center";

                    let currencyrate = namespace.Pepper.MarketData.rates[item.asset.code];
                    if (item.asset.code === "USD" || item.asset.code === "USDT") {
                        this.drawText(context, item.x + item.width * 0.5, item.y + this.unit * 0.31, item.asset.code + "/BTC " + namespace.Pepper.Resources.localeText[120], "rgba(255, 255, 255, 0.7)", 0.67);
                        if (currencyrate && currencyrate.rate > 0) {
                            const quote = namespace.Pepper.MarketData.rates["BTC"];
                            this.drawText(context, item.x + item.width * 0.5, item.y + this.unit * 0.81, namespace.Pepper.Tools.formatPrice(1/quote.rate, currencyrate.precision), "rgba(255, 255, 255, 1)", 0.9);
                        }
                    }
                    else {
                        this.drawText(context, item.x + item.width * 0.5, item.y + this.unit * 0.31, item.asset.code + "/USD " + namespace.Pepper.Resources.localeText[120], "rgba(255, 255, 255, 0.7)", 0.67);
                        if (currencyrate && currencyrate.rate > 0) {
                            this.drawText(context, item.x + item.width * 0.5, item.y + this.unit * 0.81, namespace.Pepper.Tools.formatPrice(1/currencyrate.rate, currencyrate.precision), "rgba(255, 255, 255, 1)", 0.9);
                        }
                    }

                    if (item.loadingChart) {
                        this.drawLoader(context, item.x + item.width * 0.5, item.y + item.height * 0.5, this.unit);
                    }
                    else if (!item.hasChart) {
                        this.drawText(context, item.x + item.width * 0.5, item.y + this.unit * 2.5, namespace.Pepper.Resources.localeText[119], "rgba(255, 255, 255, 0.5)", 1);
                    }

                    context.drawImage(item.canvas, item.x + this.unit * 0.2, item.y + item.height * 0.2 + this.unit * 0.2, item.width - this.unit * 0.4, item.height * 0.8 - this.unit * 0.4);
                }
            }

            context.restore();
        }
    };

    // Draw the tabs.
    namespace.Pepper.View.prototype.drawTabs = function (context) {
        context.save();
        context.translate(0, -this.dashboardTime * this.carousel.height * 2);

        context.fillStyle = "rgb(255, 255, 255)";
        context.fillRect(this.viewport.x, this.transactionsBtn.y, this.viewport.width, this.transactionsBtn.height);

        context.fillStyle = "rgba(36, 41, 46, 0.16)";
        context.fillRect(this.viewport.x, this.transactionsBtn.y + this.transactionsBtn.height, this.viewport.width, this.unit * 0.02);

        context.fillStyle = "rgba(36, 41, 46," + this.transactionsBtn.selectTime * 0.2 + ")";
        context.font = this.tabId === 0 ? this.getFont("Roboto-Bold") : this.getFont("Roboto-Regular");
        context.fillRect(this.transactionsBtn.x, this.transactionsBtn.y, this.transactionsBtn.width, this.transactionsBtn.height);
        this.drawText(context, this.transactionsBtn.x + this.transactionsBtn.width * 0.5, this.transactionsBtn.y + this.transactionsBtn.height * 0.5, namespace.Pepper.Resources.localeText[47], this.tabId === 0 ? namespace.Pepper.Resources.primaryColor : "rgb(50, 47, 66)", 0.8);

        context.fillStyle = "rgba(36, 41, 46," + this.assetsBtn.selectTime * 0.2 + ")";
        context.font = this.tabId === 1 ? this.getFont("Roboto-Bold") : this.getFont("Roboto-Regular");
        context.fillRect(this.assetsBtn.x, this.assetsBtn.y, this.assetsBtn.width, this.assetsBtn.height);
        this.drawText(context, this.assetsBtn.x + this.assetsBtn.width * 0.5, this.assetsBtn.y + this.assetsBtn.height * 0.5, namespace.Pepper.Resources.localeText[48], this.tabId === 1 ? namespace.Pepper.Resources.primaryColor : "rgb(50, 47, 66)", 0.8);

        context.fillStyle = namespace.Pepper.Resources.primaryColor;
        context.fillRect(this.menuMarker.x, this.menuMarker.y, this.menuMarker.width, this.menuMarker.height);

        context.save();
        if (this.filterBtn.hover || this.filterBtn.selected) {
            context.globalAlpha = 0.7 * context.globalAlpha;
        }
        context.drawImage(namespace.Pepper.Resources.filterImage, this.filterBtn.x, this.filterBtn.y, this.filterBtn.width, this.filterBtn.width);
        context.restore();

        const size = Math.max(0, this.addAssetBtn.width - Math.abs(this.menuMarker.tx - this.menuMarker.x));
        if (this.tabId && size > this.unit * 0.2) {
            if (this.addAssetBtn.selected) {
                context.globalAlpha = 0.7 * context.globalAlpha;
            }
            context.drawImage(namespace.Pepper.Resources.addImage, this.addAssetBtn.x - this.unit * 0.2, this.addAssetBtn.y - this.unit * 0.2, size + this.unit * 0.4, size + this.unit * 0.4);
        }

        context.restore();
    };

    // Draw the list.
    namespace.Pepper.View.prototype.drawList = function (context) {
        context.save();

        if (this.list.startTime > 0.25) {
            const startTime = this.list.startTime - 0.25;
            context.translate(0, -startTime * this.unit * 10);
        }
        context.globalAlpha = 1 - this.list.startTime * 2;

        context.save();
        context.fillStyle = "rgb(255, 255, 255)";
        context.fillRect(this.list.x, this.list.y - this.list.headerHeight - namespace.Pepper.barHeight, this.width, this.list.height + this.list.headerHeight + namespace.Pepper.barHeight);
        context.restore();

        context.textAlign = "left";
        context.font = this.getFont("Roboto-Regular");

        context.save();
        context.beginPath();
        context.rect(this.list.x, this.list.y - this.unit * 0.2, this.list.width, this.list.height + this.unit * 0.2);
        context.clip();

        context.save();
        context.translate(0, -this.list.offset);
        for (let i = 0; i < this.list.items.length; i += 1) {
            let item = this.list.items[i];
            if (item.y - this.list.offset + item.height > this.list.y
                && item.y - this.list.offset - item.height < this.list.y + this.list.height) {
                this.drawListItem(context, item);
            }
        }
        context.restore();

        if (this.list.hasBar && (this.list.isDown || this.list.scrollTime)) {
            const barwidth = this.unit * 0.1;
            const alpha = context.globalAlpha;
            const limitedOffset = Math.max(0, Math.min(this.list.maxOffset, this.list.offset));
            const offset = limitedOffset * this.list.height / (this.list.maxOffset + this.list.height);
            context.globalAlpha = Math.min(1, this.list.scrollTime) * alpha;
            this.roundRect(context, this.list.x - barwidth + this.list.width, this.list.y, barwidth, this.list.height, barwidth * 0.5, "rgba(0, 0, 0, 0.1)");
            this.roundRect(context, this.list.x - barwidth + this.list.width, this.list.y + offset, barwidth, this.list.barSize, barwidth * 0.5, "rgba(0, 0, 0, 0.3)");
            context.globalAlpha = alpha;
        }

        context.restore();
        context.restore();

        // Loading.
        if (namespace.Core.currentAccount.assets.length === 0
            && this.error === namespace.Pepper.ViewErrorType.None) {
            this.drawLoader(context, this.list.x + this.list.width * 0.5, this.list.y + this.list.height * 0.5, this.unit, true);
        }
        else if (this.error === namespace.Pepper.ViewErrorType.AccountNotAvailable) {
            context.save();
            context.textAlign = "center";
            this.drawText(context, this.list.x + this.list.width * 0.5, this.list.y + this.list.height * 0.5 - this.unit * 0.8, namespace.Pepper.Resources.localeText[108], "rgb(50, 47, 66)", 0.72);
            this.drawLoader(context, this.list.x + this.list.width * 0.5, this.list.y + this.list.height * 0.5, this.unit, true);
            context.restore();
        }

        switch (this.error) {
            case namespace.Pepper.ViewErrorType.AccountNotCreated:
                break;
            case namespace.Pepper.ViewErrorType.AccountNotAvailable:
                break;
        }
    };

    // Draw a list item.
    namespace.Pepper.View.prototype.drawListItem = function (context, item) {
        let amount, price, text, extent, now, fdate, quoteCurrency, baseCurrency;

        context.save();

        context.textAlign = "left";

        context.fillStyle = "rgb(255, 255, 255)";
        context.fillRect(item.x, item.y, item.width, item.height);
        context.fillStyle = item.insertTime ? "rgba(42, 193, 188, " + 0.15 * item.insertTime + ")" : "rgba(255, 255, 255, 0)";
        context.fillRect(item.x, item.y, item.width, item.height);
        context.fillStyle = item.selected || item.hover ? "rgba(36, 41, 46, 0.07)" : "rgba(255, 255, 255, 0)";
        context.font = this.getFont("Roboto-Regular");
        context.fillRect(item.x, item.y, item.width, item.height);
        context.fillStyle = "rgba(36, 41, 46, 0.07)";
        context.fillRect(item.x, item.y + item.height - this.unit * 0.03, item.width, this.unit * 0.03);

        switch (item.data.type) {
            case "path_payment":
                context.font = this.getFont("Roboto-Regular");
                context.drawImage(namespace.Pepper.Resources.tradeImage, item.x + this.unit * 0.2, item.y + this.unit * 0.1, this.unit, this.unit);

                quoteCurrency = item.data.asset_code ? item.data.asset_code : "XLM"; 
                baseCurrency = item.data.source_asset_code ? item.data.source_asset_code : "XLM";

                if (item.asset) {
                    amount = namespace.Pepper.Tools.formatPrice(item.data.source_amount, item.asset.decimals);
                    price = namespace.Pepper.Tools.formatPrice(item.data.amount, item.asset.decimals);
                }
                else {
                    amount = item.data.source_amount;
                    price = item.data.amount;
                }

                text = namespace.Pepper.Resources.localeText[117] + " " + baseCurrency + " -> " + quoteCurrency + " ";
                context.font = this.getFont("Roboto-Regular");
                extent = context.measureText(text).width * 0.8;
                this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 0.5, text, "rgba(36, 41, 46, 0.75)", 0.8);
                this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 1, amount + " -> " + price, "rgba(36, 41, 46, 0.5)", 0.65);
                context.font = this.getFont("Roboto-Bold");

                context.save();
                context.globalAlpha = context.globalAlpha * 0.5;
                context.drawImage(namespace.Pepper.Resources.launchImage, item.x + item.width - this.unit * 0.97, item.y + this.unit * 0.5, this.unit * 0.7, this.unit * 0.7);
                context.restore();

                if (item.data.memo) {
                    context.drawImage(namespace.Pepper.Resources.memoImage, item.x + this.unit * 7.5, item.y + this.unit * 0.5, this.unit * 0.7 * (1 - item.memoButtonTime), this.unit * 0.7 * (1 - item.memoButtonTime));
                }

                now = new Date().getTime();
                fdate = namespace.Pepper.Tools.friendlyTime(now, item.rawDate);
                context.font = this.getFont("Roboto-Regular");
                if (fdate.short) {
                    this.drawText(context, item.x + this.unit * 1.25, item.y + item.height * 0.85, fdate.friendly, "rgb(33, 150, 243)", 0.6);
                }
                else {
                    this.drawText(context, item.x + this.unit * 1.25, item.y + item.height * 0.85, fdate.friendly, "rgba(36, 41, 46, 0.45)", 0.6);
                }
                break;
            case "create_passive_offer":
            case "manage_offer":
                context.font = this.getFont("Roboto-Regular");
                context.drawImage(namespace.Pepper.Resources.tradeImage, item.x + this.unit * 0.2, item.y + this.unit * 0.1, this.unit, this.unit);

                quoteCurrency = item.data.buying_asset_code ? item.data.buying_asset_code : "XLM";
                baseCurrency = item.data.selling_asset_code ? item.data.selling_asset_code : "XLM";

                if (item.asset) {
                    amount = namespace.Pepper.Tools.formatPrice(item.data.amount, item.asset.decimals);
                    price = namespace.Pepper.Tools.formatPrice(item.data.price, item.asset.decimals);
                }
                else {
                    amount = item.data.amount;
                    price = item.data.price;
                }

                text = (Number(amount) > 0 ? namespace.Pepper.Resources.localeText[115] : namespace.Pepper.Resources.localeText[116]) + " " + baseCurrency + "/" + quoteCurrency + " ";
                context.font = this.getFont("Roboto-Regular");
                extent = context.measureText(text).width * 0.8;
                this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 0.5, text, Number(amount) > 0 ? "rgba(36, 41, 46, 0.75)" : "rgb(219, 83, 101)" , 0.8);
                this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 1, "@ " + price, "rgba(36, 41, 46, 0.5)", 0.65);
                context.font = this.getFont("Roboto-Bold");
                if (Number(amount) > 0) {
                    this.drawText(context, item.x + this.unit * 1.25 + extent, item.y + this.unit * 0.5, amount, "rgba(36, 41, 46, 0.8)", 0.8);
                }
                context.save();
                context.globalAlpha = context.globalAlpha * 0.5;
                context.drawImage(namespace.Pepper.Resources.launchImage, item.x + item.width - this.unit * 0.97, item.y + this.unit * 0.5, this.unit * 0.7, this.unit * 0.7);
                if (item.data.memo) {
                    context.drawImage(namespace.Pepper.Resources.memoImage, item.x + this.unit * 7.5, item.y + this.unit * 0.5, this.unit * 0.7 * (1 - item.memoButtonTime), this.unit * 0.7 * (1 - item.memoButtonTime));
                }
                context.restore();

                now = new Date().getTime();
                fdate = namespace.Pepper.Tools.friendlyTime(now, item.rawDate);
                context.font = this.getFont("Roboto-Regular");
                if (fdate.short) {
                    this.drawText(context, item.x + this.unit * 1.25, item.y + item.height * 0.85, fdate.friendly, "rgb(33, 150, 243)", 0.6);
                }
                else {
                    this.drawText(context, item.x + this.unit * 1.25, item.y + item.height * 0.85, fdate.friendly, "rgba(36, 41, 46, 0.45)", 0.6);
                }
                break;
            case "account_merge":
                context.font = this.getFont("Roboto-Regular");
                context.drawImage(namespace.Pepper.Resources.mergeImage, item.x + this.unit * 0.2, item.y + this.unit * 0.1, this.unit, this.unit);
                this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 0.5, namespace.Pepper.Resources.localeText[114], "rgba(36, 41, 46, 0.75)", 0.8);

                if (item.data.account) {
                    this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 1, namespace.Pepper.Tools.truncateKey(item.data.account), "rgba(36, 41, 46, 0.5)", 0.65);
                }

                context.save();
                context.globalAlpha = context.globalAlpha * 0.5;
                context.drawImage(namespace.Pepper.Resources.launchImage, item.x + item.width - this.unit * 0.97, item.y + this.unit * 0.5, this.unit * 0.7, this.unit * 0.7);
                context.restore();

                if (item.data.memo) {
                    context.drawImage(namespace.Pepper.Resources.memoImage, item.x + this.unit * 7.5, item.y + this.unit * 0.5, this.unit * 0.7 * (1 - item.memoButtonTime), this.unit * 0.7 * (1 - item.memoButtonTime));
                }

                now = new Date().getTime();
                fdate = namespace.Pepper.Tools.friendlyTime(now, item.rawDate);
                context.font = this.getFont("Roboto-Regular");
                if (fdate.short) {
                    this.drawText(context, item.x + this.unit * 1.25, item.y + item.height * 0.85, fdate.friendly, "rgb(33, 150, 243)", 0.6);
                }
                else {
                    this.drawText(context, item.x + this.unit * 1.25, item.y + item.height * 0.85, fdate.friendly, "rgba(36, 41, 46, 0.45)", 0.6);
                }
                break;
            case "bump_sequence":
                context.font = this.getFont("Roboto-Regular");
                context.drawImage(namespace.Pepper.Resources.optionsImage, item.x + this.unit * 0.2, item.y + this.unit * 0.1, this.unit, this.unit);
                this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 0.5, namespace.Pepper.Resources.localeText[113], "rgba(36, 41, 46, 0.75)", 0.8);

                if (item.data.bump_to) {
                    this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 1, item.data.bump_to, "rgba(36, 41, 46, 0.5)", 0.65);
                }

                context.save();
                context.globalAlpha = context.globalAlpha * 0.5;
                context.drawImage(namespace.Pepper.Resources.launchImage, item.x + item.width - this.unit * 0.97, item.y + this.unit * 0.5, this.unit * 0.7, this.unit * 0.7);
                context.restore();

                if (item.data.memo) {
                    context.drawImage(namespace.Pepper.Resources.memoImage, item.x + this.unit * 7.5, item.y + this.unit * 0.5, this.unit * 0.7 * (1 - item.memoButtonTime), this.unit * 0.7 * (1 - item.memoButtonTime));
                }

                now = new Date().getTime();
                fdate = namespace.Pepper.Tools.friendlyTime(now, item.rawDate);
                context.font = this.getFont("Roboto-Regular");
                if (fdate.short) {
                    this.drawText(context, item.x + this.unit * 1.25, item.y + item.height * 0.85, fdate.friendly, "rgb(33, 150, 243)", 0.6);
                }
                else {
                    this.drawText(context, item.x + this.unit * 1.25, item.y + item.height * 0.85, fdate.friendly, "rgba(36, 41, 46, 0.45)", 0.6);
                }
                break;
            case "manage_data":
                context.font = this.getFont("Roboto-Regular");
                context.drawImage(namespace.Pepper.Resources.penImage, item.x + this.unit * 0.2, item.y + this.unit * 0.1, this.unit, this.unit);
                this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 0.5, namespace.Pepper.Resources.localeText[112], "rgba(36, 41, 46, 0.75)", 0.8);

                if (item.data.name) {
                    this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 1, item.data.name, "rgba(36, 41, 46, 0.5)", 0.65);
                }

                context.save();
                context.globalAlpha = context.globalAlpha * 0.5;
                context.drawImage(namespace.Pepper.Resources.launchImage, item.x + item.width - this.unit * 0.97, item.y + this.unit * 0.5, this.unit * 0.7, this.unit * 0.7);
                context.restore();

                if (item.data.memo) {
                    context.drawImage(namespace.Pepper.Resources.memoImage, item.x + this.unit * 7.5, item.y + this.unit * 0.5, this.unit * 0.7 * (1 - item.memoButtonTime), this.unit * 0.7 * (1 - item.memoButtonTime));
                }

                now = new Date().getTime();
                fdate = namespace.Pepper.Tools.friendlyTime(now, item.rawDate);
                context.font = this.getFont("Roboto-Regular");
                if (fdate.short) {
                    this.drawText(context, item.x + this.unit * 1.25, item.y + item.height * 0.85, fdate.friendly, "rgb(33, 150, 243)", 0.6);
                }
                else {
                    this.drawText(context, item.x + this.unit * 1.25, item.y + item.height * 0.85, fdate.friendly, "rgba(36, 41, 46, 0.45)", 0.6);
                }
                break;
            case "set_options":
                context.font = this.getFont("Roboto-Regular");
                context.drawImage(namespace.Pepper.Resources.optionsImage, item.x + this.unit * 0.2, item.y + this.unit * 0.1, this.unit, this.unit);
                this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 0.5, namespace.Pepper.Resources.localeText[111], "rgba(36, 41, 46, 0.75)", 0.8);

                if (item.data.home_domain) {
                    this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 1, item.data.home_domain, "rgba(36, 41, 46, 0.5)", 0.65);
                }

                context.save();
                context.globalAlpha = context.globalAlpha * 0.5;
                context.drawImage(namespace.Pepper.Resources.launchImage, item.x + item.width - this.unit * 0.97, item.y + this.unit * 0.5, this.unit * 0.7, this.unit * 0.7);
                context.restore();

                if (item.data.memo) {
                    context.drawImage(namespace.Pepper.Resources.memoImage, item.x + this.unit * 7.5, item.y + this.unit * 0.5, this.unit * 0.7 * (1 - item.memoButtonTime), this.unit * 0.7 * (1 - item.memoButtonTime));
                }

                now = new Date().getTime();
                fdate = namespace.Pepper.Tools.friendlyTime(now, item.rawDate);
                context.font = this.getFont("Roboto-Regular");
                if (fdate.short) {
                    this.drawText(context, item.x + this.unit * 1.25, item.y + item.height * 0.85, fdate.friendly, "rgb(33, 150, 243)", 0.6);
                }
                else {
                    this.drawText(context, item.x + this.unit * 1.25, item.y + item.height * 0.85, fdate.friendly, "rgba(36, 41, 46, 0.45)", 0.6);
                }
                break;
            case "allow_trust":
                context.font = this.getFont("Roboto-Regular");
                if (item.data.authorize) {
                    context.drawImage(namespace.Pepper.Resources.linkImage, item.x + this.unit * 0.2, item.y + this.unit * 0.1, this.unit, this.unit);
                    this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 0.5, namespace.Pepper.Resources.localeText[109], "rgba(36, 41, 46, 0.75)", 0.8);
                }
                else {
                    context.drawImage(namespace.Pepper.Resources.unlinkImage, item.x + this.unit * 0.2, item.y + this.unit * 0.1, this.unit, this.unit);
                    this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 0.5, namespace.Pepper.Resources.localeText[110], "rgba(36, 41, 46, 0.75)", 0.8);
                }
                this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 1, namespace.Pepper.Tools.truncateKey(item.data.asset_issuer), "rgba(36, 41, 46, 0.5)", 0.65);
                this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 1.5, namespace.Pepper.Tools.truncateKey(item.data.asset_code), "rgba(36, 41, 46, 0.5)", 0.65);

                if (item.data.memo) {
                    context.drawImage(namespace.Pepper.Resources.memoImage, item.x + this.unit * 7.5, item.y + this.unit * 0.5, this.unit * 0.7 * (1 - item.memoButtonTime), this.unit * 0.7 * (1 - item.memoButtonTime));
                }

                context.save();
                context.globalAlpha = context.globalAlpha * 0.5;
                context.drawImage(namespace.Pepper.Resources.copyImage, item.x + this.unit * 6.5, item.y + this.unit * 0.5, this.unit * 0.7 * (1 - item.copyButtonTime), this.unit * 0.7 * (1 - item.copyButtonTime));
                context.drawImage(namespace.Pepper.Resources.launchImage, item.x + item.width - this.unit * 0.97, item.y + this.unit * 0.5, this.unit * 0.7 * (1 - item.launchButtonTime), this.unit * 0.7 * (1 - item.launchButtonTime));
                context.restore();
                break;
            case "change_trust":
                context.font = this.getFont("Roboto-Regular");
                if (Number(item.data.limit) > 0) {
                    context.drawImage(namespace.Pepper.Resources.linkImage, item.x + this.unit * 0.2, item.y + this.unit * 0.1, this.unit, this.unit);
                    this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 0.5, namespace.Pepper.Resources.localeText[63], "rgba(36, 41, 46, 0.75)", 0.8);
                }
                else {
                    context.drawImage(namespace.Pepper.Resources.unlinkImage, item.x + this.unit * 0.2, item.y + this.unit * 0.1, this.unit, this.unit);
                    this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 0.5, namespace.Pepper.Resources.localeText[64], "rgba(36, 41, 46, 0.75)", 0.8);
                }
                this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 1, namespace.Pepper.Tools.truncateKey(item.data.asset_issuer), "rgba(36, 41, 46, 0.5)", 0.65);
                this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 1.5, namespace.Pepper.Tools.truncateKey(item.data.asset_code), "rgba(36, 41, 46, 0.5)", 0.65);

                if (item.data.memo) {
                    context.drawImage(namespace.Pepper.Resources.memoImage, item.x + this.unit * 7.5, item.y + this.unit * 0.5, this.unit * 0.7 * (1 - item.memoButtonTime), this.unit * 0.7 * (1 - item.memoButtonTime));
                }
                context.save();
                context.globalAlpha = context.globalAlpha * 0.5;
                context.drawImage(namespace.Pepper.Resources.copyImage, item.x + this.unit * 6.5, item.y + this.unit * 0.5, this.unit * 0.7 * (1 - item.copyButtonTime), this.unit * 0.7 * (1 - item.copyButtonTime));
                context.drawImage(namespace.Pepper.Resources.launchImage, item.x + item.width - this.unit * 0.97, item.y + this.unit * 0.5, this.unit * 0.7 * (1 - item.launchButtonTime), this.unit * 0.7 * (1 - item.launchButtonTime));
                context.restore();
                break;
            case "payment":
                text = (item.data.asset_code ? item.data.asset_code : "XLM") + " ";
                context.font = this.getFont("Roboto-Regular");
                extent = context.measureText(text).width * 0.8;
                this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 0.5, text, "rgba(36, 41, 46, 0.75)", 0.8);
                if (item.data.to === namespace.Core.currentAccount.keys.publicKey()) {
                    context.drawImage(namespace.Pepper.Resources.receiveImage, item.x + this.unit * 0.2, item.y + this.unit * 0.1, this.unit, this.unit);
                    this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 1, namespace.Pepper.Tools.truncateKey(item.data.from), "rgba(36, 41, 46, 0.5)", 0.65);
                    context.font = this.getFont("Roboto-Bold");
                    if (item.asset) {
                        amount = namespace.Pepper.Tools.formatPrice(item.data.amount, item.asset.decimals);
                    }
                    else {
                        amount = item.data.amount;
                    }
                    this.drawText(context, item.x + this.unit * 1.25 + extent, item.y + this.unit * 0.5, "+ " + amount, "rgb(118, 201, 105)", 0.8);
                }
                else {
                    if (item.asset) {
                        amount = namespace.Pepper.Tools.formatPrice(item.data.amount, item.asset.decimals);
                    }
                    else {
                        amount = item.data.amount;
                    }
                    context.drawImage(namespace.Pepper.Resources.sendImage, item.x + this.unit * 0.2, item.y + this.unit * 0.1, this.unit, this.unit);
                    this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 1, namespace.Pepper.Tools.truncateKey(item.data.to), "rgba(36, 41, 46, 0.5)", 0.65);
                    context.font = this.getFont("Roboto-Bold");
                    this.drawText(context, item.x + this.unit * 1.25 + extent, item.y + this.unit * 0.5, "- " + amount, "rgba(36, 41, 46, 0.8)", 0.8);
                }
                context.save();
                context.globalAlpha = context.globalAlpha * 0.5;
                context.drawImage(namespace.Pepper.Resources.copyImage, item.x + this.unit * 6.5, item.y + this.unit * 0.5, this.unit * 0.7 * (1 - item.copyButtonTime), this.unit * 0.7 * (1 - item.copyButtonTime));

                if (item.data.memo) {
                    context.drawImage(namespace.Pepper.Resources.memoImage, item.x + this.unit * 7.5, item.y + this.unit * 0.5, this.unit * 0.7 * (1 - item.memoButtonTime), this.unit * 0.7 * (1 - item.memoButtonTime));
                }

                context.drawImage(namespace.Pepper.Resources.launchImage, item.x + item.width - this.unit * 0.97, item.y + this.unit * 0.5, this.unit * 0.7 * (1 - item.launchButtonTime), this.unit * 0.7 * (1 - item.launchButtonTime));
                context.restore();

                now = new Date().getTime();
                fdate = namespace.Pepper.Tools.friendlyTime(now, item.rawDate);
                context.font = this.getFont("Roboto-Regular");
                if (fdate.short) {
                    this.drawText(context, item.x + this.unit * 1.25, item.y + item.height * 0.85, fdate.friendly, "rgb(33, 150, 243)", 0.6);
                }
                else {
                    this.drawText(context, item.x + this.unit * 1.25, item.y + item.height * 0.85, fdate.friendly, "rgba(36, 41, 46, 0.45)", 0.6);
                }
                break;
            case "create_account":
                text = "XLM ";
                context.font = this.getFont("Roboto-Regular");
                extent = context.measureText(text).width * 0.8;
                this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 0.5, text, "rgba(36, 41, 46, 0.75)", 0.8);

                if (item.data.account === namespace.Core.currentAccount.keys.publicKey()) {
                    context.drawImage(namespace.Pepper.Resources.receiveImage, item.x + this.unit * 0.2, item.y + this.unit * 0.1, this.unit, this.unit);
                    this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 1, namespace.Pepper.Tools.truncateKey(item.data.source_account), "rgba(36, 41, 46, 0.5)", 0.65);
                    context.font = this.getFont("Roboto-Bold");
                    if (item.asset) {
                        amount = namespace.Pepper.Tools.formatPrice(item.data.starting_balance, item.asset.decimals);
                    }
                    else {
                        amount = item.data.starting_balance;
                    }
                    this.drawText(context, item.x + this.unit * 1.25 + extent, item.y + this.unit * 0.5, "+ " + amount, "rgb(118, 201, 105)", 0.8);
                }
                else {
                    context.drawImage(namespace.Pepper.Resources.sendImage, item.x + this.unit * 0.2, item.y + this.unit * 0.1, this.unit, this.unit);
                    this.drawText(context, item.x + this.unit * 1.25, item.y + this.unit * 1, namespace.Pepper.Tools.truncateKey(item.data.account), "rgba(36, 41, 46, 0.5)", 0.65);
                    context.font = this.getFont("Roboto-Bold");
                    if (item.asset) {
                        amount = namespace.Pepper.Tools.formatPrice(item.data.starting_balance, item.asset.decimals);
                    }
                    else {
                        amount = item.data.starting_balance;
                    }
                    this.drawText(context, item.x + this.unit * 1.25 + extent, item.y + this.unit * 0.5, "+ " + amount, "rgba(36, 41, 46, 0.8)", 0.8);
                }
                context.save();
                context.globalAlpha = context.globalAlpha * 0.5;
                context.drawImage(namespace.Pepper.Resources.copyImage, item.x + this.unit * 6.5, item.y + this.unit * 0.5, this.unit * 0.7 * (1 - item.copyButtonTime), this.unit * 0.7 * (1 - item.copyButtonTime));

                if (item.data.memo) {
                    context.drawImage(namespace.Pepper.Resources.memoImage, item.x + this.unit * 7.5, item.y + this.unit * 0.5, this.unit * 0.7 * (1 - item.memoButtonTime), this.unit * 0.7 * (1 - item.memoButtonTime));
                }

                context.drawImage(namespace.Pepper.Resources.launchImage, item.x + item.width - this.unit * 0.97, item.y + this.unit * 0.5, this.unit * 0.7 * (1 - item.launchButtonTime), this.unit * 0.7 * (1 - item.launchButtonTime));
                context.restore();

                now = new Date().getTime();
                fdate = namespace.Pepper.Tools.friendlyTime(now, item.rawDate);
                context.font = this.getFont("Roboto-Regular");
                if (fdate.short) {
                    this.drawText(context, item.x + this.unit * 1.25, item.y + item.height * 0.85, fdate.friendly, "rgb(33, 150, 243)", 0.6);
                }
                else {
                    this.drawText(context, item.x + this.unit * 1.25, item.y + item.height * 0.85, fdate.friendly, "rgba(36, 41, 46, 0.45)", 0.6);
                }
                break;
            case "asset":
                if (!item.data.loaded) {
                    this.drawLoader(context, item.x + item.width * 0.5, item.y + item.height * 0.5, this.unit * 0.7, true);
                }
                else {
                    if (item.data.validImage) {
                        context.drawImage(item.data.image, item.x + this.unit * 0.48, item.y + this.unit * 0.18, this.unit * 0.84, this.unit * 0.84);
                    }
                    else if (item.data.code === "XLM") {
                        context.drawImage(namespace.Pepper.Resources.stellarImage, item.x + this.unit * 0.48, item.y + this.unit * 0.18, this.unit * 0.84, this.unit * 0.84);
                    }
                    else {
                        this.circle(context, item.x + this.unit * 0.9, item.y + this.unit * 0.6, this.unit * 0.45, "rgba(50, 47, 66, 0.1)");
                    }

                    context.textAlign = "center";
                    context.font = this.getFont("Roboto-Bold");
                    this.drawText(context, item.x + this.unit * 0.92, item.y + this.unit * 1.4, item.data.code, "rgb(50, 47, 66)", 0.75);

                    context.textAlign = "right";
                    context.font = this.getFont("Roboto-Regular");
                    this.drawText(context, item.x + item.width - this.unit * 1.2, item.y + this.unit * 1.4, item.data.name, "rgba(50, 47, 66, 1)", 0.75);

                    context.font = this.getFont("Roboto-Light");
                    this.drawText(context, item.x + item.width - this.unit * 1.2, item.y + item.height - this.unit * 1.41, item.data.domain, "rgba(50, 47, 66, 0.5)", 0.75);

                    if (item.data.deposit) {
                        this.drawText(context, item.x + item.width - this.unit * 1.2, item.y + item.height - this.unit * 0.94, namespace.Pepper.Resources.localeText[42], "rgb(23, 156, 75)", 0.6);
                        context.drawImage(namespace.Pepper.Resources.seamlessImage, item.x + item.width - this.unit, item.y + item.height - this.unit * 1.55, this.unit * 0.7, this.unit * 0.7);
                    }
                    else if (item.data.verified) {
                        this.drawText(context, item.x + item.width - this.unit * 1.2, item.y + item.height - this.unit * 0.94, namespace.Pepper.Resources.localeText[42], "rgb(23, 156, 75)", 0.6);
                        context.drawImage(namespace.Pepper.Resources.shieldImage, item.x + item.width - this.unit, item.y + item.height - this.unit * 1.55, this.unit * 0.7, this.unit * 0.7);
                    }
                    else {
                        this.drawText(context, item.x + item.width - this.unit * 1.2, item.y + item.height - this.unit * 0.94, namespace.Pepper.Resources.localeText[43], "rgb(255, 30, 55)", 0.6);
                        context.drawImage(namespace.Pepper.Resources.warningImage, item.x + item.width - this.unit, item.y + item.height - this.unit * 1.55, this.unit * 0.7, this.unit * 0.7);
                    }

                    if (item.data.balance) {
                        context.textAlign = "left";
                        context.font = this.getFont("Roboto-Regular");
                        this.drawText(context, item.x + this.unit * 1.7, item.y + this.unit * 0.38, namespace.Pepper.Resources.localeText[40], "rgba(50, 47, 66, 0.5)", 0.7);
                        this.drawText(context, item.x + this.unit * 1.7, item.y + this.unit * 0.86, namespace.Pepper.Tools.formatPrice(item.data.balance, item.data.decimals), "rgb(23, 156, 75)", 0.85);
                    }
                    else {
                        if (!namespace.Pepper.queryAsset) {
                            context.textAlign = "center";
                            context.font = this.getFont("Roboto-Bold");

                            if (item.hasAdd) {
                                if (item.overAddBtn) {
                                    this.roundRect(context, item.x + this.unit * 1.7, item.y + this.unit * 0.25, this.unit * 2.4, this.unit * 0.7, this.unit * 0.18, namespace.Pepper.Resources.primaryColor, true, namespace.Pepper.Resources.primaryColor);
                                    this.drawText(context, item.x + this.unit * 2.9, item.y + this.unit * 0.6, namespace.Pepper.Resources.localeText[62], "rgb(255, 255, 255)", 0.7);
                                }
                                else {
                                    this.roundRect(context, item.x + this.unit * 1.7, item.y + this.unit * 0.25, this.unit * 2.4, this.unit * 0.7, this.unit * 0.18, "rgba(255, 255, 255, 0)", true, namespace.Pepper.Resources.primaryColor);
                                    this.drawText(context, item.x + this.unit * 2.9, item.y + this.unit * 0.6, namespace.Pepper.Resources.localeText[62], namespace.Pepper.Resources.primaryColor, 0.7);
                                }
                            }
                            else {
                                this.roundRect(context, item.x + this.unit * 1.7, item.y + this.unit * 0.25, this.unit * 2.4, this.unit * 0.7, this.unit * 0.18, "rgba(255, 255, 255, 0)", true, "rgba(0, 0, 0, 0.1)");
                                this.drawText(context, item.x + this.unit * 2.9, item.y + this.unit * 0.6, namespace.Pepper.Resources.localeText[62], "rgba(0, 0, 0, 0.1)", 0.7);
                            }
                        }
                        else if (item.data === namespace.Pepper.queryAsset) {
                            this.roundRect(context, item.x + this.unit * 1.7, item.y + this.unit * 0.25, this.unit * 2.4, this.unit * 0.7, this.unit * 0.18, "rgba(255, 255, 255, 0)", true, "rgba(0, 0, 0, 0.35)");
                            this.drawLoader(context, item.x + this.unit * 1.7 + this.unit * 1.2, item.y + this.unit * 0.25 + this.unit * 0.35, this.unit * 0.7, true);
                        }
                        else {
                            context.textAlign = "center";
                            context.font = this.getFont("Roboto-Bold");
                            this.roundRect(context, item.x + this.unit * 1.7, item.y + this.unit * 0.25, this.unit * 2.4, this.unit * 0.7, this.unit * 0.18, "rgba(255, 255, 255, 0)", true, "rgba(0, 0, 0, 0.1)");
                            this.drawText(context, item.x + this.unit * 2.9, item.y + this.unit * 0.6, namespace.Pepper.Resources.localeText[125], "rgba(0, 0, 0, 0.1)", 0.7);
                        }
                    }
                }
                break;
            default:
                this.drawText(context, item.x + item.width * 0.5, item.y + this.unit * 1.4, "unknown type:" + item.data.type, "rgba(50, 47, 66, 0.5)", 0.7);
                break;
        }

        context.restore();
    };

    // Draw the numpad.
    namespace.Pepper.View.prototype.drawNumPad = function (context) {
        const offset = this.sendFormEndTime ? this.unit * 4 - this.unit * 4 * this.sendFormEndTime * 2 : this.isSendMode ? this.sendFormOffset : 0;

        context.save();
        context.translate(0, offset * 2);

        context.save();
        context.save();
        context.fillStyle = "rgb(255, 255, 255)";
        context.shadowColor = "rgba(0, 0, 0, 0.3)";
        context.shadowBlur = this.unit * 0.1;
        context.fillRect(this.list.x, this.carousel.y + this.carousel.height + this.unit * 0.3, this.list.width, this.viewport.height);
        context.restore();
        context.save();
        context.fillStyle = "rgb(255, 255, 255)";
        context.fillRect(this.list.x, this.carousel.y + this.numPadArea.y - this.unit * 1.7 - namespace.Pepper.barHeight, this.list.width, this.viewport.height);
        context.restore();

        if (this.sendStep === 0) {
            context.save();
            const shift = Math.max(0, this.carouselItem.selectTime - 0.25);
            const middleY = this.carousel.y + this.carousel.height + this.unit * 0.4 + (this.numPad[0].y - (this.carousel.y + this.carousel.height + this.unit * 0.1)) * 0.5 - this.unit * 0.7;
            context.textAlign = "left";
            this.drawText(context, this.list.x + this.unit * 1.2, middleY - this.unit * 0.2, namespace.Pepper.Resources.localeText[51], namespace.Pepper.Resources.primaryColor, 0.8);

            context.fillStyle = namespace.Pepper.Resources.primaryColor;
            context.fillRect(this.list.x + this.unit * 1.2, middleY + this.unit * 1.35, this.list.width - this.unit * 2.4, this.unit * 0.03);

            context.textAlign = "left";
            context.font = this.getFont("Roboto-Medium");
            context.save();
            context.globalAlpha = context.globalAlpha * (1 - this.carouselItem.selectTime * 2);
            context.translate(shift * this.unit * 2.5, 0);
            this.drawText(context, this.list.x + this.unit * 1.2, middleY + this.unit * 0.7, this.getActiveCarouselItem().asset.code, namespace.Pepper.Resources.primaryColor, 1.3);
            context.restore();

            const start = this.list.x + this.unit * 0.6 + this.unit * 1.6;
            const end = start + this.list.width - this.unit * 2.6 - this.unit * 0.8;

            if (this.amountError) {
                const trx = this.amountErrorTime * this.unit * this.numPadSendBtn.heartBeats[0].time * 0.5;
                context.globalAlpha = (this.amountErrorTime > 0.7 ? (1 - this.amountErrorTime) * 3 : 1) * context.globalAlpha;
                context.translate(trx, 0);
                context.font = this.getFont("Roboto-Bold");
                context.textAlign = "right";
                this.drawText(context, end, middleY + this.unit * 0.7, "0", "rgb(219, 83, 101)", 1.7);
            }
            else if (!this.sendAmount.length) {
                context.font = this.getFont("Roboto-Bold");
                context.textAlign = "right";
                this.drawText(context, end, middleY + this.unit * 0.7, "0", "rgb(36, 41, 46)", 1.7);
            }
            else {
                context.font = this.getFont("Roboto-Bold");
                context.textAlign = "right";

                if (Number(namespace.Core.currentAccount.getMaxSend(this.getActiveCarouselItem().asset.balance, !this.carousel.active)) < this.sendAmount) {
                    const trx = this.amountErrorTime * this.unit * this.numPadSendBtn.heartBeats[0].time * 0.5;
                    context.translate(trx, 0);
                    context.globalAlpha = (this.amountErrorTime > 0.7 ? (1 - this.amountErrorTime) * 3 : 1) * context.globalAlpha;
                    this.drawText(context, end, middleY + this.unit * 0.7, this.sendAmount, "rgb(219, 83, 101)", 1.7);
                }
                else {
                    this.drawText(context, end, middleY + this.unit * 0.7, this.sendAmount, "rgb(36, 41, 46)", 1.7);
                }
            }
            context.restore();
        }
        else if (this.sendStep === 5) {
            context.save();
            const shift = Math.max(0, this.carouselItem.selectTime - 0.25);
            const middleY = this.carousel.y + this.carousel.height + this.unit * 0.4 + (this.numPad[0].y - (this.carousel.y + this.carousel.height + this.unit * 0.1)) * 0.5 - this.unit * 0.7;
            context.textAlign = "left";
            this.drawText(context, this.list.x + this.unit * 1.2, middleY - this.unit * 0.2, namespace.Pepper.Resources.localeText[72], namespace.Pepper.Resources.primaryColor, 0.8);

            context.fillStyle = namespace.Pepper.Resources.primaryColor;
            context.fillRect(this.list.x + this.unit * 1.2, middleY + this.unit * 1.35, this.list.width - this.unit * 2.4, this.unit * 0.03);

            context.textAlign = "left";
            context.font = this.getFont("Roboto-Medium");
            context.save();


            context.textAlign = "center";
            this.drawText(context, this.list.x + this.unit * 1.5 + (this.list.width - this.unit * 3) / 2,
                middleY - this.unit * 0.3 + this.list.width - this.unit * 2.5, namespace.Pepper.Resources.qrCodeText, "rgb(36, 41, 46)", 0.7);

            context.font = this.getFont("Roboto-Regular");
            if (this.carousel.active) {
                this.drawText(context, this.list.x + this.unit * 1.5 + (this.list.width - this.unit * 3) / 2,
                    middleY + this.unit * 0.2 + this.list.width - this.unit * 2.5, namespace.Pepper.Resources.localeText[73], "rgba(36, 41, 46, 0.7)", 0.62);
            }
            else {
                this.drawText(context, this.list.x + this.unit * 1.5 + (this.list.width - this.unit * 3) / 2,
                    middleY + this.unit * 0.2 + this.list.width - this.unit * 2.5, namespace.Pepper.Resources.localeText[74], "rgba(36, 41, 46, 0.7)", 0.62);
            }

            context.globalAlpha = context.globalAlpha * (1 - this.carouselItem.selectTime * 2);

            context.textAlign = "left";
            context.translate(shift * this.unit * 2.5, 0);
            this.drawText(context, this.list.x + this.unit * 1.2, middleY + this.unit * 0.7, this.getActiveCarouselItem().asset.code, namespace.Pepper.Resources.primaryColor, 1.3);
            context.restore();

            context.textAlign = "right";
            this.drawText(context, this.list.x + this.list.width - this.unit * 1.2, middleY + this.unit * 0.7, namespace.Pepper.Resources.localeText[75], "rgba(36, 41, 46, 0.7)", 0.62);

            context.save();
            context.globalAlpha = context.globalAlpha * (1 - this.carouselItem.selectTime * 2);
            context.translate(this.list.x + this.unit * 1.5 + (this.list.width - this.unit * 3) * 0.5, middleY + this.unit * 1.8);
            context.scale(0.67 + Math.max(0, (this.carouselItem.selectTime - 0.3) * 5) * 0.1, 0.67 + Math.max(0, (this.carouselItem.selectTime - 0.3) * 5) * 0.1);
            context.translate(-(this.list.x + this.unit * 1.5 + (this.list.width - this.unit * 3) * 0.5), -(middleY + this.unit * 1.8));
            context.drawImage(namespace.Pepper.Resources.qrCodeImage, this.list.x + this.unit * 1.5, middleY + this.unit * 1.8, this.list.width - this.unit * 3, this.list.width - this.unit * 3);

            context.restore();
            context.restore();
        }

        // Draw the numpad area.
        if (this.sendStep === 0) {
            context.save();
            context.font = this.getFont("Roboto-Bold");
            for (let i = 0; i < this.numPad.length; i += 1) {
                const element = this.numPad[i];
                let color = "rgb(36, 41, 46)";
                const scale = 1.16;
                let alpha = 1;

                const index = this.sendAmount.indexOf(".");
                if (element.id !== 11 && (this.sendAmount.length >= this.maxSendDigit ||
                    element.id === 12 && index !== -1)) {
                    color = "rgba(36, 41, 46, 0.3)";
                }
                else if (element.selected) {
                    color = "rgb(255, 255, 255)";
                }
                else if (element.hover) {
                    color = "rgba(36, 41, 46, 0.5)";
                    alpha = 0.5;
                }

                if (element.selected || element.selectTime) {
                    const margin = this.unit * 0.1;
                    this.roundRect(context, element.x + margin, element.y + margin, element.width - margin * 2, element.height - margin * 2, this.unit * 0.1, "rgba(42, 193, 188, " + (element.selectTime ? element.selectTime * 0.5 : 0.5) + ")");
                }

                if (element.id < 11) {
                    this.drawText(context, element.x + element.width * 0.5, element.y + element.height * 0.5, element.id.toString(), color, scale);
                }
                else if (element.id === 11) {
                    context.save();
                    context.globalAlpha = alpha * context.globalAlpha;
                    if (element.selected) {
                        context.drawImage(namespace.Pepper.Resources.backLightImage, element.x + element.width * 0.5 - element.height * 0.26, element.y + element.height * 0.25, element.height * 0.47, element.height * 0.47);
                    }
                    else {
                        context.drawImage(namespace.Pepper.Resources.backDarkImage, element.x + element.width * 0.5 - element.height * 0.26, element.y + element.height * 0.25, element.height * 0.47, element.height * 0.47);
                    }
                    context.restore();
                }
                else if (element.id === 12) {
                    this.drawText(context, element.x + element.width * 0.5, element.y + element.height * 0.25, ".", color, scale * 2);
                }
            }
            context.restore();
        }

        context.restore();

        if (this.sendStep !== 2 && this.sendStep !== 5 && this.sendStep !== 6) {
            context.save();
            this.roundRect(context, this.numPadSendBtn.x, this.numPadSendBtn.y, this.numPadSendBtn.width, this.numPadSendBtn.height, this.numPadSendBtn.height * 0.1, "rgb(42, 193, 188)");
            context.font = this.getFont("Roboto-Medium");
            if (this.numPadSendBtn.hover || this.numPadSendBtn.selected) {
                context.globalAlpha = 0.7 * context.globalAlpha;
            }
            if (this.sendStep === 1) {
                this.drawText(context, this.numPadSendBtn.x + this.numPadSendBtn.width * 0.5, this.numPadSendBtn.y + this.numPadSendBtn.height * 0.5, namespace.Pepper.Resources.localeText[44], "rgb(255, 255, 255)", 1);
            }
            else if (this.sendStep === 0) {
                this.drawText(context, this.numPadSendBtn.x + this.numPadSendBtn.width * 0.5, this.numPadSendBtn.y + this.numPadSendBtn.height * 0.5, namespace.Pepper.Resources.localeText[4], "rgb(255, 255, 255)", 1);
            }
            else if (this.sendStep === 3) {
                this.drawText(context, this.numPadSendBtn.x + this.numPadSendBtn.width * 0.5, this.numPadSendBtn.y + this.numPadSendBtn.height * 0.5, namespace.Pepper.Resources.localeText[28], "rgb(255, 255, 255)", 1);
            }

            context.restore();
        }
        else if (this.sendStep === 2) {
            let middleY = this.carousel.y + this.carousel.height + this.unit * 0.1 + (this.numPad[0].y - (this.carousel.y + this.carousel.height + this.unit * 0.1)) * 0.5 - this.unit * 0.7;
            let size = Math.min(this.numPadArea.width, this.numPadSendBtn.y - middleY - this.unit);

            if (namespace.Pepper.Resources.currentSponsor) {
                context.drawImage(namespace.Pepper.Resources.currentSponsor.image, this.numPadSendBtn.x + this.numPadSendBtn.width * 0.5 - size * 0.5, middleY, size, size);
            }

            context.textAlign = "center";
            this.drawText(context, this.numPadSendBtn.x + this.numPadSendBtn.width * 0.5, middleY + size + this.unit * 0.3, namespace.Pepper.Resources.localeText[71], "rgb(36, 41, 46)", 0.6);

            this.roundRect(context, this.numPadSendBtn.x, this.numPadSendBtn.y, this.numPadSendBtn.width, this.numPadSendBtn.height, this.numPadSendBtn.height * 0.1, "rgb(42, 193, 188)");
            this.drawLoader(context, this.numPadSendBtn.x + this.numPadSendBtn.width * 0.5, this.numPadSendBtn.y + this.numPadSendBtn.height * 0.5, this.numPadSendBtn.height * 0.7);
        }

        context.save();
        if (this.numPadCloseBtn.hover || this.numPadCloseBtn.selected) {
            context.globalAlpha = 0.7 * context.globalAlpha;
        }
        if (this.sendStep === 1 || this.sendStep === 2) {
            context.drawImage(namespace.Pepper.Resources.closeDarkImage, this.numPadCloseBtn.x, this.numPadCloseBtn.y, this.numPadCloseBtn.width, this.numPadCloseBtn.height);
        }
        else {
            context.drawImage(namespace.Pepper.Resources.closeDarkImage, this.numPadCloseBtn.x, this.numPadCloseBtn.y, this.numPadCloseBtn.width, this.numPadCloseBtn.height);
        }
        context.restore();

        if (this.sendStep === 1) {
            context.save();
            if (this.bookBtn.hover || this.bookBtn.selected) {
                context.globalAlpha = 0.7 * context.globalAlpha;
            }
            context.drawImage(namespace.Pepper.Resources.bookImage, this.bookBtn.x, this.bookBtn.y, this.bookBtn.width, this.bookBtn.height);
            context.restore();

            context.save();
            if (this.pasteBtn.hover || this.pasteBtn.selected) {
                context.globalAlpha = 0.7 * context.globalAlpha;
            }
            context.drawImage(namespace.Pepper.Resources.pasteImage, this.pasteBtn.x, this.pasteBtn.y, this.pasteBtn.width, this.pasteBtn.height);
            context.restore();

            context.save();
            if (this.qrBtn.hover || this.qrBtn.selected) {
                context.globalAlpha = 0.7 * context.globalAlpha;
            }
            context.drawImage(namespace.Pepper.Resources.qrImage, this.qrBtn.x, this.qrBtn.y, this.qrBtn.width, this.qrBtn.height);
            context.restore();

            if (this.addressError) {
                context.textAlign = "left";
                context.font = this.getFont("Roboto-Regular");
                const trx = this.addressErrorTime * this.unit * this.numPadSendBtn.heartBeats[0].time * 0.5;
                context.globalAlpha = (this.addressErrorTime > 0.7 ? (1 - this.addressErrorTime) * 3 : 1) * context.globalAlpha;
                context.translate(trx, 0);
            }
        }
        else if (this.sendStep === 3) {
            if (this.sendErrorTxt === "") {
                const margin = (this.viewport.y + this.viewport.height * 0.5 - this.unit * 5.6 - this.viewport.y) * 0.5;
                const trx = this.sendTransition * this.unit * this.numPadSendBtn.heartBeats[0].time * 3;
                context.font = this.getFont("Roboto-Bold");
                context.drawImage(namespace.Pepper.Resources.success2Image, this.viewport.x + this.viewport.width * 0.5 - this.unit * 0.75 - trx, this.viewport.y + this.unit * 3.8 - trx + margin, this.unit * 1.5 + trx * 2, this.unit * 1.5 + trx * 2);
                this.drawText(context, this.viewport.x + this.viewport.width * 0.5 - trx, this.viewport.y + this.unit * 5.6 + margin, namespace.Pepper.Resources.localeText[31], "rgb(185, 208, 95)", 1.3);

                context.font = this.getFont("Roboto-Medium");
                this.drawText(context, this.viewport.x + this.viewport.width * 0.5, this.viewport.y + this.unit * 7 + margin, namespace.Pepper.Resources.localeText[65], "rgb(36, 41, 46)", 0.77);

                context.font = this.getFont("Roboto-Regular");
                this.drawText(context, this.viewport.x + this.viewport.width * 0.5, this.viewport.y + this.unit * 8.6 + margin, namespace.Pepper.Resources.localeText[69], "rgb(36, 41, 46)", 0.73);
                this.drawText(context, this.viewport.x + this.viewport.width * 0.5, this.viewport.y + this.unit * 9.1 + margin, namespace.Pepper.Resources.localeText[70], "rgb(36, 41, 46)", 0.73);

            }
            else {
                const margin = (this.viewport.y + this.viewport.height * 0.5 - this.unit * 5.6 - this.viewport.y) * 0.5;
                const trx = this.sendTransition * this.unit * this.numPadSendBtn.heartBeats[0].time * 3;
                context.font = this.getFont("Roboto-Bold");
                context.drawImage(namespace.Pepper.Resources.errorImage, this.viewport.x + this.viewport.width * 0.5 - this.unit * 0.75 - trx, this.viewport.y + this.unit * 3.8 + margin, this.unit * 1.5, this.unit * 1.5);
                this.drawText(context, this.viewport.x + this.viewport.width * 0.5 + trx, this.viewport.y + this.unit * 5.6 + margin, namespace.Pepper.Resources.localeText[32], "rgb(219, 83, 101)", 1.3);

                context.font = this.getFont("Roboto-Medium");
                this.drawText(context, this.viewport.x + this.viewport.width * 0.5, this.viewport.y + this.unit * 7.5 + margin, namespace.Pepper.Resources.localeText[66], "rgb(36, 41, 46)", 0.77);

                context.font = this.getFont("Roboto-Regular");
                this.drawText(context, this.viewport.x + this.viewport.width * 0.5, this.viewport.y + this.unit * 8.6 + margin, namespace.Pepper.Resources.localeText[67], "rgb(36, 41, 46)", 0.73);
                this.drawText(context, this.viewport.x + this.viewport.width * 0.5, this.viewport.y + this.unit * 9.1 + margin, namespace.Pepper.Resources.localeText[68], "rgb(36, 41, 46)", 0.73);
            }
        }
        else if (this.sendStep === 6) {
            let middleY = this.carousel.y + this.carousel.height + this.unit * 0.1 + (this.numPad[0].y - (this.carousel.y + this.carousel.height + this.unit * 0.1)) * 0.5 - this.unit * 0.7;
            let size = Math.min(this.numPadArea.width, this.numPadSendBtn.y - middleY - this.unit);

            if (namespace.Pepper.Resources.sponsors[2]) {
                context.drawImage(namespace.Pepper.Resources.sponsors[2].image, this.numPadSendBtn.x + this.numPadSendBtn.width * 0.5 - size * 0.5, middleY, size, size);
            }
        }

        if (this.sendTransition) {
            context.save();
            context.globalAlpha = this.sendTransition * 3;
            context.fillStyle = "rgb(255, 255, 255)";
            context.fillRect(this.list.x, this.carousel.y + this.carousel.height + this.unit * 0.3, this.list.width, this.viewport.height);
            context.fillRect(this.list.x, this.carousel.y + this.numPadArea.y - this.unit * 1.7 - namespace.Pepper.barHeight, this.list.width, this.viewport.height);
            context.restore();
        }

        context.restore();
    };

    // Draw the loader.
    namespace.Pepper.View.prototype.drawLoader = function (context, x, y, size, dark) {
        context.save();
        context.globalAlpha = 0.7 * context.globalAlpha;
        context.translate(x, y);
        context.rotate(this.perpetualAngle);
        context.translate(-x, -y);
        if (dark) {
            context.drawImage(namespace.Pepper.Resources.syncDarkImage, x - size * 0.5, y - size * 0.5, size, size);
        }
        else {
            context.drawImage(namespace.Pepper.Resources.syncImage, x - size * 0.5, y - size * 0.5, size, size);
        }
        context.restore();
        this.needRedraw = true;
    };

    // Draw text.
    namespace.Pepper.View.prototype.drawText = function (context, x, y, text, color, scale) {
        context.save();
        context.translate(x, y);
        context.scale(scale, scale);
        context.translate(-x, -y);
        context.fillStyle = color;
        context.fillText(text, x, y);
        context.restore();
    };

    // Draw a rounded rectangle.
    namespace.Pepper.View.prototype.roundRect = function (context, x, y, w, h, r, color, strike, strikeColor) {
        if (!(h <= 0 || w <= 0 || r < 0)) {
            context.save();
            if (w < 2 * r) {
                r = w / 2;
            }

            if (h < 2 * r) {
                r = h / 2;
            }

            context.beginPath();
            context.moveTo(x + r, y);
            context.arcTo(x + w, y, x + w, y + h, r);
            context.arcTo(x + w, y + h, x, y + h, r);
            context.arcTo(x, y + h, x, y, r);
            context.arcTo(x, y, x + w, y, r);
            context.fillStyle = color;
            context.fill();

            if (strike) {
                context.lineWidth = 1;
                context.strokeStyle = strikeColor;
                context.stroke();
            }
            context.restore();
        }
    };

    // Draw a circle.
    namespace.Pepper.View.prototype.circle = function (context, x, y, radius, color, strike, strikeColor) {
        if (radius > 0) {
            context.save();
            context.beginPath();
            context.arc(x, y, radius, 0, 2 * Math.PI);
            context.fillStyle = color;
            context.fill();
            if (strike) {
                context.lineWidth = 1;
                context.strokeStyle = strikeColor;
                context.stroke();
            }
            context.restore();
        }
    };

    // Draw the triangle.
    namespace.Pepper.View.prototype.triangle = function (context, x, y, size, color, down) {
        const path = new Path2D();
        context.save();
        context.fillStyle = color;
        path.moveTo(x + size * 0.5, y + (down ? -size * 0.5 : size * 0.5));
        path.lineTo(x, y + (down ? size * 0.5 : -size * 0.5));
        path.lineTo(x - size * 0.5, y + (down ? -size * 0.5 : size * 0.5));
        context.fill(path);
        context.restore();
    };

    // Get the font.
    namespace.Pepper.View.prototype.getFont = function (name) {
        return this.baseFontSize * namespace.Pepper.Resources.languageScale + "px " + name;
    };

    // Load the scroller.
    namespace.Pepper.View.prototype.loadScroller = function (type) {
        this.scroller.type = type;
        this.scroller.offset = 0;
        this.scroller.maxOffset = 0;
        this.scroller.minOffset = 0;
        this.scroller.isDown = false;
        this.scroller.downTime = 0;
        this.scroller.downDistance = 0;
        this.scroller.items = [];
        switch (type) {
            case namespace.Pepper.ScrollerType.Accounts:
                let data = namespace.Pepper.loadWalletData();
                for (let i = 0; i < data.accounts.length; i += 1) {
                    this.scroller.items.push({
                        "label": data.accounts[i].name,
                        "id": data.accounts[i].id,
                        "current": i === data.lastaccount ? true : false
                    });
                }
                this.showScroller = true;
                this.scrollerTime = 0.25;
                break;
            case namespace.Pepper.ScrollerType.Languages:
                for (let languageId in namespace.Pepper.Resources.languagePacks) {
                    if (namespace.Pepper.Resources.languagePacks.hasOwnProperty(languageId)) {
                        let pack = namespace.Pepper.Resources.languagePacks[languageId];
                        this.scroller.items.push({
                            "languageId": languageId,
                            "label": pack.name,
                            "text": pack.text,
                            "current": languageId === namespace.Pepper.Resources.languageId ? true : false
                        });
                    }
                }
                this.showScroller = true;
                this.scrollerTime = 0.25;
                break;
            case namespace.Pepper.ScrollerType.Addresses:
                for (let i = 0; i < namespace.Core.currentAccount.addresses.length; i += 1) {
                    this.scroller.items.push({
                        "id": namespace.Core.currentAccount.addresses[i],
                        "label": namespace.Pepper.Tools.truncateKey(namespace.Core.currentAccount.addresses[i], true),
                        "current": false
                    });
                }
                this.showScroller = true;
                this.scrollerTime = 0.25;
                break;
            case namespace.Pepper.ScrollerType.AddAsset:
                this.showScroller = true;
                this.scrollerTime = 0.25;
                break;
            case namespace.Pepper.ScrollerType.Currencies:
                let foundCurrency = false;
                for (let rate in namespace.Pepper.MarketData.rates) {
                    if (namespace.Pepper.MarketData.rates.hasOwnProperty(rate)) {
                        this.scroller.items.push({
                            "id": rate,
                            "label": rate,
                            "current": rate === this.account.currency ? true : false
                        });
                    }

                    if (rate === this.account.currency) {
                        foundCurrency = true;
                    }
                }

                if (!foundCurrency) {
                    this.scroller.items.push({
                        "id": this.account.currency,
                        "label": this.account.currency,
                        "current": true
                    });
                }
                this.showScroller = true;
                this.scrollerTime = 0.25;
                break;
            case namespace.Pepper.ScrollerType.Assets:
                for (let i = 0; i < this.carousel.items.length; i += 1) {
                    const item = this.carousel.items[i];
                    this.scroller.items.push({
                        "id": i,
                        "label": item.asset.name,
                        "current": i === this.carousel.active ? true : false
                    });
                }

                if (this.scroller.items.length === 0) {
                    this.scroller.items.push({
                        "id": 0,
                        "label": this.placeHolderAsset.asset.name,
                        "current": true
                    });
                }
                this.showScroller = true;
                this.scrollerTime = 0.25;
                break;
            case namespace.Pepper.ScrollerType.AccountSettings:
                this.scroller.items.push({
                    "id": 0,
                    "label": namespace.Pepper.Resources.localeText[140],
                    "current": false
                });

                this.scroller.items.push({
                    "id": 1,
                    "label": namespace.Pepper.Resources.localeText[147],
                    "current": false
                });

                this.scroller.items.push({
                    "id": 2,
                    "label": namespace.Pepper.Resources.localeText[154],
                    "current": false
                });

                this.scroller.items.push({
                    "id": 3,
                    "label": namespace.Pepper.Resources.localeText[155],
                    "current": false
                });

                this.scroller.items.push({
                    "id": 4,
                    "label": namespace.Core.currentAccount.friendlyAddress ? namespace.Core.currentAccount.friendlyAddress : namespace.Pepper.Resources.localeText[156],
                    "current": false
                });

                this.scroller.items.push({
                    "id": this.scroller.items.length,
                    "label": namespace.Pepper.Resources.localeText[139],
                    "current": false
                });

                this.scroller.items.push({
                    "id": this.scroller.items.length,
                    "label": namespace.Pepper.Resources.localeText[141],
                    "current": false
                });
                this.deleteStep = 0;
                this.showScroller = true;
                this.scrollerTime = 0.25;
                break;
            case namespace.Pepper.ScrollerType.AssetsMenu:
                let activeItem = this.getActiveCarouselItem();
                this.scroller.items.push({ "id": 1, "label": namespace.Pepper.Resources.localeText[77], "current": false, "enabled": true });
                this.scroller.items.push({ "id": 2, "label": namespace.Pepper.Resources.localeText[78], "current": false, "enabled": true });
                this.scroller.items.push({ "id": 3, "label": namespace.Pepper.Resources.localeText[79], "current": false, "enabled": true });
                this.scroller.items.push({ "id": 4, "label": namespace.Pepper.Resources.localeText[80], "current": false, "enabled": activeItem.asset.domain ? true : false });
                if (activeItem) {
                    this.scroller.items.push({ "id": 5, "label": namespace.Pepper.Resources.localeText[81], "current": false, "enabled": !namespace.Pepper.queryAsset && this.carousel.active !== 0 && Number(activeItem.asset.balance) === 0 });
                }
                this.showScroller = true;
                this.scrollerTime = 0.25;
                break;
            case namespace.Pepper.ScrollerType.FilterMenu:
                if (this.tabId === 1) {
                    this.scroller.items.push({ "id": namespace.Pepper.FilterType.Trusted, "label": namespace.Pepper.Resources.localeText[83], "current": false, time: 0 });
                    this.scroller.items.push({ "id": namespace.Pepper.FilterType.WithBalance, "label": namespace.Pepper.Resources.localeText[84], "current": false, time: 0 });
                }
                else {
                    this.scroller.items.push({ "id": namespace.Pepper.FilterType.PaymentReceived, "label": namespace.Pepper.Resources.localeText[85], "current": false, time: 0 });
                    this.scroller.items.push({ "id": namespace.Pepper.FilterType.PaymentSent, "label": namespace.Pepper.Resources.localeText[86], "current": false, time: 0 });
                    this.scroller.items.push({ "id": namespace.Pepper.FilterType.Trades, "label": namespace.Pepper.Resources.localeText[87], "current": false, time: 0 });
                    this.scroller.items.push({ "id": namespace.Pepper.FilterType.Trust, "label": namespace.Pepper.Resources.localeText[88], "current": false, time: 0 });
                    this.scroller.items.push({ "id": namespace.Pepper.FilterType.Other, "label": namespace.Pepper.Resources.localeText[89], "current": false, time: 0 });
                }
                this.showScroller = true;
                this.scrollerTime = 0.25;
                break;
        }
    };

    // Reset the list.
    namespace.Pepper.View.prototype.resetList = function (type) {
        this.list.type = type;
        this.list.offset = 0;
        this.list.maxOffset = 0;
        this.list.minOffset = 0;
        this.list.isDown = false;
        this.list.downTime = 0;
        this.list.downDistance = 0;
        this.list.items = [];
        this.list.startTime = 0.5;
        switch (type) {
            case namespace.Pepper.ListType.Transactions:
                this.tabId = 0;
                break;
            case namespace.Pepper.ListType.Assets:
                this.tabId = 1;
                break;
        }
    };

    // Reset the carousel.
    namespace.Pepper.View.prototype.resetCarousel = function () {
        this.carousel.offset = 0;
        this.carousel.maxOffset = 0;
        this.carousel.minOffset = 0;
        this.carousel.isDown = false;
        this.carousel.downTime = 0;
        this.carousel.downDistance = 0;
        this.carousel.items = [];
        this.carousel.anchored = false;
        this.carousel.anchor = 0;
        this.carousel.active = 0;
        this.carousel.canClick = false;
        this.carousel.direction = 0;
    };

    // Reset the pin page.
    namespace.Pepper.View.prototype.resetPinPage = function (signUpMode, menu) {
        let data = namespace.Pepper.loadWalletData();
        if (data.lastaccount === -1) {
            signUpMode = true;
        }
        this.page = signUpMode ? namespace.Pepper.PageType.SignUp : namespace.Pepper.PageType.SignIn;
        this.isPinMenu = menu ? true : false;
        this.isDashboardMenu = false;
        this.dashboardMenuOffset = 0;
        this.pinStep = 0;
        this.pinError = false;
        this.pinAccountName = !signUpMode ? data.accounts[data.lastaccount].name : "";
        this.hasPinSwitchBtn = signUpMode && data.accounts.length > 0 || !signUpMode && data.accounts.length > 1 ? true : false;
        this.pinCode = [];
        this.pinCodeCheck = [];
    };

    // Close the send page.
    namespace.Pepper.View.prototype.closeSendPage = function (cb, force) {
        if (this.isSendMode || force) {
            this.sendFormEndTime = force ? 0 : 0.5;
            this.list.startTime = force ? 0 : 0.5;
            this.amountError = false;
            this.addressError = false;
            this.isSendMode = false;
            cb();
        }
    };

    // Get active carousel item.
    namespace.Pepper.View.prototype.getActiveCarouselItem = function () {
        if (this.carousel.active >= 0 && this.carousel.active < this.carousel.items.length) {
            return this.carousel.items[this.carousel.active];
        }
        return this.placeHolderAsset; // May be null.
    };

    // Select carousel item with scrolling animation.
    namespace.Pepper.View.prototype.setActiveCarouselItem = function (index, force) {
        if (!force && index === this.carousel.active
            || index < 0
            || index > this.carousel.items.length - 1) {
            return;
        }

        if (index < this.carousel.active) {
            this.carousel.offset -= (this.carousel.active - index - 1) * this.carousel.colWidth + this.carousel.colWidth * 0;
            this.carousel.direction = 0;
        }
        else if (index > this.carousel.active) {
            this.carousel.offset += (index - this.carousel.active - 1) * this.carousel.colWidth + this.carousel.colWidth * 0.1;
            this.carousel.direction = 1;
        }
        else {
            this.carousel.direction = -1;
        }
        this.carousel.anchored = false;
        this.carousel.canClick = false;
    };

    // Rotate the sponsor.
    namespace.Pepper.View.prototype.rotateSponsor = function () {
        if (namespace.Pepper.Resources.sponsors.length) {
            this.currentIndex = isNaN(this.currentIndex) ? parseInt(Math.random() * namespace.Pepper.Resources.sponsors.length - 1) : this.currentIndex + 1;
            if (this.currentIndex >= namespace.Pepper.Resources.sponsors.length) {
                this.currentIndex = 0;
            }
            namespace.Pepper.Resources.currentSponsor = namespace.Pepper.Resources.sponsors[this.currentIndex];

            if (namespace.Pepper.Resources.currentSponsor.code && namespace.Pepper.Resources.currentSponsor.issuer) {
                let asset = namespace.Core.currentAccount.assets.find(x => x.code === namespace.Pepper.Resources.currentSponsor.code && x.issuer === namespace.Pepper.Resources.currentSponsor.issuer);
                if (asset && this.currentIndex > 0) {
                    this.rotateSponsor(); // Get the next sponsor as we have this one already.
                }
                else if (this.currentIndex === 0) {
                    // Disable sponsoring.
                    namespace.Pepper.Resources.currentSponsor = null;
                }
            }
        }
    };

    /**
     * The bar height (provided by native layer on mobile).
     * @member barHeight
     * @memberof Litemint.Pepper
     */
    namespace.Pepper.barHeight = 0;

})(window.Litemint = window.Litemint || {});
