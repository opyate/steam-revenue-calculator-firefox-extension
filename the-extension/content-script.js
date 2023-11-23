// everything below as-is copied from https://chromewebstore.google.com/detail/gjhejidajnchnadcangcodljgdmenipa
var CurrentAppID;
//https://store.steampowered.com/api/appdetails?appids=1015180&cc=us&filters=price_overview

var xmlhttp = new XMLHttpRequest();
var url = "https://store.steampowered.com/api/appdetails?appids="+ GetCurrentAppID() +"&cc=us&filters=price_overview";

xmlhttp.onreadystatechange=function() 
{
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        var price = getPrice(xmlhttp.responseText);
    outputToYolo(price);
    }
}
xmlhttp.open("GET", url, true);
xmlhttp.send();

function getPrice(response) {
    var arr = JSON.parse(response);
  return arr[GetCurrentAppID()]["data"]["price_overview"]["initial"];
}



function outputToYolo(price)
{
  const positiveVoteText = document.querySelector( 'label[for="review_type_positive"] .user_reviews_count' );
  const negativeVoteText = document.querySelector( 'label[for="review_type_negative"] .user_reviews_count' );
  const positiveVotes = parseInt( positiveVoteText.textContent.replace( /[(.,)]/g, '' ), 10 );
  const totalVotes = positiveVotes + parseInt( negativeVoteText.textContent.replace( /[(.,)]/g, '' ), 10 );


  const subtitle = document.createElement( 'div' );
  subtitle.className = 'subtitle column';
  subtitle.textContent = 'Est. Net Revenue:';

  const summary = document.createElement( 'div' );

  //The old methhod
  //var netRevenue = abbreviateNumber((price /100) * totalVotes * 15);

  //The new one
  var grossRevenue = calculateRevenue(totalVotes, price);
  var breakdown = revenueBreakdown(grossRevenue);
  var netRevenue = abbreviateNumber(breakdown.netRevenue / 100);

  summary.innerHTML = '<span class="responsive_reviewdesc">~$ ' + netRevenue +'</span>';
  
  const container = document.createElement( 'div' );
  container.className = 'user_reviews_summary_row';

  container.appendChild( subtitle );
  container.appendChild( summary );

  let element = document.querySelector( '#userReviews' );

  if( element )
  {
    element.appendChild( container );
  }
}


function GetCurrentAppID()
{
  if( !CurrentAppID )
  {
    CurrentAppID = GetAppIDFromUrl( location.pathname );
  }

  return CurrentAppID;
}

function GetAppIDFromUrl( url )
{
  const appid = url.match( /\/(app|sub|bundle|friendsthatplay|gamecards|recommended)\/([0-9]+)/ );

  return appid ? parseInt( appid[ 2 ], 10 ) : -1;
}

function abbreviateNumber(value) {
  let newValue = value;
  const suffixes = ["", " K", " M", " B"," T"];
  let suffixNum = 0;
  while (newValue >= 1000) {
    newValue /= 1000;
    suffixNum++;
  }

  newValue = newValue.toPrecision(3);

  newValue += suffixes[suffixNum];
  return newValue;
}


// https://github.com/Artmann/steam-revenue-calculator/blob/main/app/revenue/calculate-revenue.ts
const RevenueBreakdown = {
  adjustedRegionalPricing: 0,
  discounts: 0,
  grossRevenue: 0,
  netRevenue: 0,
  refunds: 0,
  steamFee: 0,
  vat: 0
};

function calculateRevenue(numberOfReviews, price) {
  // Source: https://newsletter.gamediscover.co/p/steam-sales-estimates-why-game-popularity
  const K = () => {
    if (numberOfReviews < 999) {
      return 20;
    }

    if (numberOfReviews < 9999) {
      return 36;
    }

    if (numberOfReviews < 49999) {
      return 49;
    }

    if (numberOfReviews < 99999) {
      return 59;
    }

    return 48;
  };

  const numberOfCopiesSold = numberOfReviews * K();
  const grossRevenue = numberOfCopiesSold * price;

  return grossRevenue;
}

function revenueBreakdown(grossRevenue) {
  const adjustedRegionalPricing = grossRevenue * 0.09;
  const discounts = grossRevenue * 0.2;
  const refunds = grossRevenue * 0.12;

  const realRevenue = grossRevenue - adjustedRegionalPricing - discounts - refunds;

  // TODO: Add tiered pricing.
  const steamFee = realRevenue * 0.3;
  const vat = realRevenue * 0.2;

  const netRevenue = realRevenue - steamFee - vat;

  return {
    adjustedRegionalPricing,
    discounts,
    grossRevenue,
    netRevenue,
    refunds,
    steamFee,
    vat
  };
}