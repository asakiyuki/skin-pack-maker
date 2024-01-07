"use strict";

{
    const _ = document;
    const skinData = {};
    // Make all button has sound on click
    [..._.getElementsByClassName('toggle_element'), ..._.querySelectorAll('input[type="file"]')].forEach(e => e.addEventListener('click', () => clickSound('release.ogg')))
    const generateUUID = () => "$$$$$$$$-$$$$-$$$$-$$$$-$$$$$$$$$$$$".replaceAll(/\$/g, () => Math.floor(Math.random() * 16).toString(16));
    // Update all element 
    const visible = (elementID, isVisible) => {
        _.getElementById(elementID).style.display = isVisible ? '' : 'none';
    };
    //Assets
    const clickSound = (soundFile) => {
        try {
            if (!soundFile) throw `soundFile is underfined!`; new Audio(`./src/sound/${soundFile}`).play();
        } catch (e) { console.error(e); }
    }
    const onChange = (elementID, callback) => _.getElementById(elementID).onchange = callback;
    const onClick = (elementID, callback, clicksound = 'release.ogg') => _.getElementById(elementID).onclick = (event) => {
        callback(event);
        if (typeof clicksound === 'boolean') {
            if (clicksound) clickSound('release.ogg')
        }
        else clickSound(clicksound)
    };
    const onImportFile = (elementID, callback, callbackWithURL = () => { }) => {
        onChange(elementID, ({ target: { files } }) => {
            try {
                const r = new FileReader();
                r.readAsDataURL(files[0]);
                r.addEventListener('load', async (g) => {
                    const f = await fetch(g.target.result).then(v => v.blob());
                    callbackWithURL(g.target.result, callback(f, files[0].type.match(/[a-z]+/g)[1]));
                });
            } catch (error) {

            }
        })
    }
    const radioToggle = (elementArrayID, callback) => {
        elementArrayID.forEach(oE => {
            onClick(oE, (e) => {
                if (e.target.className !== 'active') {
                    clickSound('release.ogg');
                    elementArrayID.forEach(iE => _.getElementById(iE).setAttribute('active', `${e.target.id === iE}`));
                    callback(elementArrayID.indexOf(e.target.id));
                }
            }, false);
        })
    };
    const toggleAction = (elementID, callback) => {
        onClick(elementID, (e) => {
            callback(e.target.checked);
        }, false);
    };
    const downloadItem = (url, filename) => {
        const a = _.createElement('a');
        a.href = url;
        a.download = filename;
        _.body.appendChild(a);
        a.click();
        _.body.removeChild(a);
    }

    const updateSkinCount = () => {
        const length = Object.keys(skinData).length;
        _.getElementById('skin-count').innerText = (length === 0) ? 'Empty Skin :(' : `${length} ${(length === 1) ? 'skin' : 'skins'} has been imported!`;
    }

    onImportFile('skin-importer', (file, type) => {
        if (type === 'png') {
            const skinID = "$$$$$$$$$$$$$$$$$$$$".replaceAll(/\$/g, () => Math.floor(Math.random() * 16).toString(16))
            const skinElement = _.createElement('div');
            skinElement.className = 'skin_item';
            skinElement.setAttribute('skin-id', skinID);
            skinElement.setAttribute('skinMode', "slam")

            skinElement.innerHTML = `<img id="render-${skinID}" class="preview_skin">
        <input id="edit-skin-name:${skinID}" placeholder="${skinID}" type="text">
        <div class="skin_button_list">
            <button class="toggle_1 toggle_radius" active="true" id="change-to-big:${skinID}">Big Hand</button>
            <button class="toggle_2 toggle_radius" id="change-to-small:${skinID}">Small Hand</button>
            <button class="toggle_3" id="remove-skin-${skinID}">
                <img draggable="false" src="./src/texture/trash.png">
            </button>
        </div>`;
            _.getElementById('skin-list').appendChild(skinElement);
            _.getElementById(`remove-skin-${skinID}`).addEventListener('click', () => {
                _.querySelector(`[skin-id="${skinID}"]`).remove();
                delete skinData[skinID];
                updateSkinCount();
                clickSound('modal_hide.ogg');
            });
            _.getElementById(`edit-skin-name:${skinID}`).oninput = (e) =>
                skinData[skinID][0] = (e.target.value === '') ? skinID : e.target.value;

            radioToggle([`change-to-big:${skinID}`,
            `change-to-small:${skinID}`],
                (e) => {
                    skinData[skinID][1] = (e === 0) ? 'slam' : 'slim';
                });


            skinData[skinID] = [
                skinID,
                'slam',
                file
            ]
            return skinID;
        }
        return false;
    }, (url, skinID) => {
        if (skinID)
            _.getElementById(`render-${skinID}`).setAttribute('src', url);
        updateSkinCount();
    })

    _.getElementById('download').onclick = async () => {
        const zip = new JSZip();
        const packName = _.getElementById('packName').value;
        const skinpackName = (packName.replaceAll(' ', '') === '') ? 'Custom Skin Pack' : packName;
        const uuid = generateUUID();
        // Generate Skin Json
        {
            let text = '';
            text += `skinpack.${skinpackName}-${uuid}=${skinpackName}\n`;
            zip.file('skins.json', await fetch('./template/skins.json').then(v => v.json()).then(v => {
                v.serialize_name = `${skinpackName}-${uuid}`;
                v.localization_name = `${skinpackName}-${uuid}`;
                Object.keys(skinData).forEach(k => {
                    const skin = skinData[k];
                    zip.file(`${k}.png`, skin[2])
                    text += `skin.${skinpackName}-${uuid}.${k}=${skin[0]}\n`;
                    v.skins.push(
                        {
                            localization_name: k,
                            geometry: `geometry.humanoid.${(skin[1] === 'slam') ? 'customSlam' : 'customSlim'}`,
                            texture: `${k}.png`,
                            type: 'free'
                        }
                    );
                });
                return JSON.stringify(v);
            }));

            zip.folder('texts').file('en_US.lang', text);
        }
        // Generate Manifest
        {
            zip.file('manifest.json', await fetch('./template/manifest.json').then(v => v.json()).then(v => {
                v.header.name = skinpackName;
                v.header.uuid = uuid;
                return JSON.stringify(v);
            }))
        }
        zip.generateAsync({ type: 'blob' }).then(c => {
            if (Object.keys(skinData).length !== 0) {
                const i = URL.createObjectURL(c);
                downloadItem(i, `${skinpackName}.mcpack`);
                URL.revokeObjectURL(i);
            }
        })
        clickSound('release.ogg');
    }
    // Draw toggle
    Array.from(_.getElementsByClassName('toggle')).forEach(v => v.innerHTML = `<div class="outside">
        <div class="btnBG"></div><svg width="3" height="15"
            style="position: absolute; top: 50%; transform: translateY(-50%); left: 13.5px;">
            <rect width="3" height="15" style="fill:rgb(255,255,255)"></rect>
        </svg> <svg width="17" height="17"
            style="position: absolute; top: 50%; transform: translateY(-50%); right: 6px;">
            <line x1="3" y1="0" x2="15" y2="0" style="stroke:rgb(65, 65, 65);stroke-width:6px" />
            <line x1="2" y1="3" x2="2" y2="15" style="stroke:rgb(65, 65, 65);stroke-width:3px" />
            <line x1="16" y1="3" x2="16" y2="15" style="stroke:rgb(65, 65, 65);stroke-width:4px" />
            <line x1="3" y1="16" x2="15" y2="16" style="stroke:rgb(65, 65, 65);stroke-width:4px" />
        </svg>
        <div class="button"></div>
    </div>`);
}