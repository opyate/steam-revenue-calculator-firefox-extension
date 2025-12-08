// everything below as-is copied from https://chromewebstore.google.com/detail/gjhejidajnchnadcangcodljgdmenipa
// extra logging added to xmlhttp.onreadystatechange
var CurrentAppID;

//https://store.steampowered.com/api/appdetails?appids=1015180&cc=us&filters=price_overview

var xmlhttp = new XMLHttpRequest();
var url = "https://store.steampowered.com/api/appdetails?appids="+ GetCurrentAppID() +"&cc=us&filters=price_overview";

xmlhttp.onreadystatechange=function() 
{
  if (xmlhttp.readyState == 4) {
    if (xmlhttp.status == 200) {
      var price = getPrice(xmlhttp.responseText);
      printer('Price is ' + abbreviateNumber(price / 100));
      outputToYolo(price);
    } else {
      printer('API request failed with ' + xmlhttp.status);
    }
  }
}
xmlhttp.open("GET", url, true);
xmlhttp.send();

function getPrice(response) {
  var arr = JSON.parse(response);
  var currentAppID = GetCurrentAppID();

  if (arr[currentAppID] && arr[currentAppID]["data"] && arr[currentAppID]["data"]["price_overview"]) {
    return arr[currentAppID]["data"]["price_overview"]["initial"];
  } else {
    return null;
  }
}



function outputToYolo(price) 
{
  const positiveVoteText = document.querySelector('label[for="review_type_positive"] .user_reviews_count');
  const negativeVoteText = document.querySelector('label[for="review_type_negative"] .user_reviews_count');

  let positiveVotes = 0;
  let totalVotes = 0;

  if (positiveVoteText && negativeVoteText) {
    positiveVotes = parseSteamNumber(positiveVoteText.textContent.replace(/[(.,)]/g, ''), 10);
    const negativeVotes = parseSteamNumber(negativeVoteText.textContent.replace(/[(.,)]/g, ''), 10);
    totalVotes = positiveVotes + negativeVotes;
  }

  //Try to find "all votes" after language based review update
  const userReviewsCountSpan = document.querySelector('span.user_reviews_count');
  if (userReviewsCountSpan) {
    const reviewCountText = userReviewsCountSpan.textContent;
    if (reviewCountText) {
      const reviewCountNumber = reviewCountText.replace(/[^\d]/g, ''); 
      if (reviewCountNumber) {
        totalVotes = parseSteamNumber(reviewCountNumber, 10);
      }
    }
  }

  const subtitle = document.createElement('div');
  subtitle.className = 'subtitle column';
  subtitle.textContent = 'Est. Net Revenue:';

  const summary = document.createElement('div');

  if (price && totalVotes !== 0) {
    const grossRevenue = calculateRevenue(totalVotes, price);
    const breakdown = revenueBreakdown(grossRevenue);
    let netRevenue = abbreviateNumber(breakdown.netRevenue / 100);

    summary.innerHTML = '<span class="responsive_reviewdesc">~$ ' + netRevenue + '</span>';
  }
  else
  {
    summary.innerHTML = '<span class="responsive_reviewdesc">---</span>';
  }


  const container = document.createElement('div');
  container.className = 'user_reviews_summary_row';

  container.appendChild(subtitle);
  container.appendChild(summary);

  const element = document.querySelector('#userReviews');

  if (element) {
    element.appendChild(container);
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
  // Thanks to Juan Uys for the fix. https://juanuys.com
  const K = () => {
    if (numberOfReviews <= 999/20) {
    return 20;
    }
   
    if (numberOfReviews <= 9999/36) {
    return 36;
    }
   
    if (numberOfReviews <= 49999/49) {
    return 49;
    }
   
    if (numberOfReviews <= 99999/59) {
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

function parseSteamNumber(str) {
  if (!str) return 0;

  // Detect Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩)
  const hasArabicDigits = /[٠-٩]/.test(str);

  if (hasArabicDigits) {
    const easternArabic = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
    const westernArabic = ['0','1','2','3','4','5','6','7','8','9'];

    easternArabic.forEach((digit, i) => {
      const regex = new RegExp(digit, 'g');
      str = str.replace(regex, westernArabic[i]);
    });
  }

  // Remove commas, spaces, periods, etc.
  str = str.replace(/[^\d]/g, '');

  return parseInt(str, 10) || 0;
}