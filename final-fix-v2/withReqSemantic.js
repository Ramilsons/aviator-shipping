$(window).on('orderFormUpdated.vtex', function(evt, orderForm) {

    if($('.shp-alert-shipping-unavailable').length < 1){
        $('.custom-radio-delivery-selected').remove();
        $('.custom-radio-pickup-in-point-selected').remove();

        insertContainer();
        insertDeliveryCards();
        insertPickUpCards(orderForm);
    
        getMethodActual(orderForm);
        // insertFirstChecked(orderForm);

        if(document.querySelectorAll('.custom-card-radio-option.delivery').length == 0 && $('.srp-toggle__delivery').hasClass('blue')) {
            vtexjs.checkout.getOrderForm();
        }

        $('.custom-radio-delivery-selected').height() == 0 ? $('.custom-radio-delivery-selected').addClass('margin-none') : null;
    }
});


let shippingByItem = [];


function insertPickUpCards(orderForm){
    let arrayOptionsShipping = orderForm.shippingData.logisticsInfo;
    let control = 0;

    arrayOptionsShipping.forEach((items) => {
        items.slas.forEach((shippingMethod) => {
            if(shippingMethod.deliveryChannel == 'delivery') {
                shippingByItem.push({
                    item: items.itemIndex,
                    method: 'delivery',
                    id: shippingMethod.id
                })
            }

            if(shippingMethod.deliveryChannel == 'pickup-in-point' && control < 3) {
                control++;
                let newName = shippingMethod.pickupStoreInfo.friendlyName.replace('Retirada -', '');
                if(newName == 'CHEAPEST') {
                    newName = 'Mais econômica'
                }
    
                if(newName == 'FASTEST') {
                    newName = 'Mais rápida'
                }

                insertOptions({
                    id: shippingMethod.id,
                    name: newName,
                    price: formatPrice(shippingMethod.price),
                    deliveryTerm: formatShippingEstimate(shippingMethod.shippingEstimate),
                    method: 'pickup-in-point'
                });
            }
        })
    })

    $(`.custom-radio-pickup-in-point-selected`).append('<a class="more-pickup-points">Ver mais opções de retirada ></a>');
    $('.more-pickup-points').on('click', () => {
        document.querySelector('.srp-pickup-info .srp-address-title.link').click();
    })
}

function insertDeliveryCards() {
    let allOptionsDelivery = document.querySelectorAll('.srp-delivery-select option');

    if(allOptionsDelivery){
        allOptionsDelivery.forEach((optionDelivery) => {
            optionDelivery.text.split('-');

            let newName = optionDelivery.value;
            if(newName == 'CHEAPEST') {
                newName = 'Mais econômica'
            }

            if(newName == 'FASTEST') {
                newName = 'Mais rápida'
            }
            
            insertOptions({
                id: optionDelivery.value,
                name: newName,
                price: optionDelivery.text.split('-')[1],
                deliveryTerm: optionDelivery.text.split('-')[0],
                method: 'delivery'
            })
        })
    }
}

function formatShippingEstimate(formatShipping) {
    let formatEstimate = formatShipping.replace('bd', '');

    if(formatEstimate == 1){
        formatEstimate = `Em até ${formatEstimate} dia útil`
    }else{
        formatEstimate = `Em até ${formatEstimate} dias úteis`
    }

    return formatEstimate;
}

function formatPrice(value) {
    let formatPrice = value;

    if(formatPrice == 0){
        formatPrice = 'Grátis'
    }

    return formatPrice;
}

function insertOptions(infos) {
    newHtmlCards = `
        <div class="custom-card-radio-option ${infos.method}" onclick="changeRadioSelected('${infos.id}')">
            <div class="custom-radio-and-name">
                <div class="custom-radio">
                    <input type="radio" id="${infos.id}" name="custom-${infos.method}" value="${infos.name}">
                </div>
                <div class="custom-radio-infos">
                    <p class="custom-name">${infos.name}</p>
                    <small>${infos.deliveryTerm}</small>
                </div>
            </div>
            <div class="custom-price-delivery">
                <p class="custom-price-info">${infos.price}</p>
            </div>
        </div>
    `
    $(`.custom-radio-${infos.method}-selected`).append(newHtmlCards);
}

function insertContainer() {
    let newHtmlContainerRadio = `
        <div class="custom-radio-delivery-selected">
        </div>
        <div class="custom-radio-pickup-in-point-selected">
        </div>
    `;

    $('#shipping-preview-container').parent().append(newHtmlContainerRadio);
}

function changeRadioSelected(id) {
    $(`input[type="radio"][id="${id}"]`).prop('checked', true);

    if($('#CHEAPEST').length > 0 && $('.custom-radio-delivery-selected'.length > 0)) {

        let priceMethodSelected = document.querySelector(`.custom-radio #${id}`).parentNode.parentNode.nextElementSibling.firstElementChild.textContent;
        let idSelected; 

        document.querySelectorAll('ul.shipping-sla-options li').forEach((eachMethodShipping) => {
            if(eachMethodShipping.outerHTML.indexOf(priceMethodSelected) != -1) {
                idSelected = eachMethodShipping.firstElementChild.id;
            }
        });

        console.log(idSelected);
        uploadMethodShipping(idSelected);
    } else {
        if(document.querySelector(`a[id="${id}"]`)) {
            document.querySelector(`a[id="${id}"]`).click();
        }else{
            uploadMethodShipping(id);
        }
    }
}

function uploadMethodShipping(id){
    let allItemsAcceptDeliveryId = []
    allItemsAcceptDeliveryId = shippingByItem.filter(items => items.id == id);

    vtexjs.checkout.getOrderForm().then(function(orderForm) {

        $(`input[type="radio"][id="${id}"]`).prop('checked', true);
        
        let originalShippingData = orderForm.shippingData;

        originalShippingData.logisticsInfo.forEach((eachLogisticInfoByItem) => {
            allItemsAcceptDeliveryId.forEach((eachItemAcceptDelivery) => {
                
                if(eachItemAcceptDelivery.item == eachLogisticInfoByItem.itemIndex) {
                    originalShippingData.logisticsInfo[eachLogisticInfoByItem.itemIndex].selectedSla = `${id}`;  
                }

            })
        })

        vtexjs.checkout.sendAttachment('shippingData', originalShippingData)
            .then(function(orderForm) {
                console.log('updated');
            })
    })
}

$(document).on("ajaxComplete", function( event, xhr, settings ) {
    if(settings.url.indexOf('/pub/orderForms/simulation') != -1) {
        $('.srp-result').append($('.srp-pickup-info'));
    }
});

function getMethodActual(orderForm) {
    let methodsSelected = [];

    orderForm.shippingData.logisticsInfo.forEach((eachItemLogistic) => {
        methodsSelected.push(eachItemLogistic.selectedDeliveryChannel);
    })

    if(methodsSelected.includes('pickup-in-point')){
        $('.custom-card-radio-option.pickup-in-point').addClass('visible-option');
        $('.custom-radio-pickup-in-point-selected').addClass('visible-container');
    }

    if(methodsSelected.includes('delivery')){
        $('.custom-card-radio-option.delivery').addClass('visible-option');
    }
}

/*
function insertFirstChecked(orderForm) {
    console.log('---------')
    console.log(orderForm);

    orderForm.shippingData.logisticsInfo.forEach((el) => {
        $(`input[type="radio"][id="${el.selectedSla}"]`).prop('checked', true);
    })
}
*/