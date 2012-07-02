(function($) {
	var searchbox = $("#MTG-pricing-search"),
		search_results = $("#search_results"),
		pricing_container = $("#pricing_results"),
		db,set_data={},val,params;
	function render_search_results(results) {
		var oResult;
		$(search_results).empty().show();
		$(pricing_container).hide();
		if (!results.length) {
			$(search_results).append($("<div />",{text:"No results..."}));
			return false;
		}
		$(results).each(function() {
			oResult = $("<div />",{
				text : this.key
			})
			$(search_results).append(oResult);
			$(oResult).data("id",this.id);
		});
	}
	function mana(symbol) {
		var subc = (symbol!=="X" && isNaN(parseInt(symbol,10)))?symbol:"num";
		return $("<span />",{
			"class" : "mana "+subc,
			"text" : (subc==="num")?symbol:""
		})
	}
	function render_card_data(card) {
		var LOADING = "retrieving...";
		$(search_results).hide();
		$(pricing_container).empty().show()
		.append($("<h2 />",{text:card.name+" ("+card.manacost+")"}))
		.append($("<span />",{text:"Touch the set bar for details","class":"details_text"}));
		for (var set in card.sets) {
			$(pricing_container).append(
				$("<div />",{"class":"set","data-set":set_data[set].longname.toLowerCase()}).append(
					$("<img />",{src:set_data[set].imgURL,alt:set}),
					$("<span />",{text:set_data[set].longname}),
					$("<span />",{text:LOADING,"class":"pricing"}),
					$("<div />",{"class":"additional_data"}).css({display:"none"}).append(
						$("<div />").append(
							$("<span />",{text:"Low: "}),
							$("<span />",{text:LOADING,"class":"low"})
						),
						$("<div />").append(
							$("<span />",{text:"Avg: "}),
							$("<span />",{text:LOADING,"class":"avg"})
						),
						$("<div />").append(
							$("<span />",{text:"High: "}),
							$("<span />",{text:LOADING,"class":"high"})
						)
					)
				)
			)
		}
		$(".set").click(function() {
			$(this).find(".additional_data").toggle();
			$(this).toggleClass("opened");
			if ($(this).hasClass("opened")) {
				$(this).animate({height:"80px"});
			} else {
				$(this).animate({height:"50px"});
			}
		})
		$(searchbox).val("");
		$.getJSON("http://blacklotusproject.com/json/?cards="+((card.name).replace(/\s/g,"+")),function(data){
			$(data.cards).each(function() {
				var set = this.url.split("/")[4].replace(/\+/g," ").replace("%3A",":").toLowerCase();
				$("div[data-set='"+set+"'] span.pricing").html("$"+this.average).addClass("has_data");
				$("div[data-set='"+set+"'] span.low").html("$"+this.low)
				$("div[data-set='"+set+"'] span.avg").html("$"+this.average)
				$("div[data-set='"+set+"'] span.high").html("$"+this.high)
			})
			$("span.pricing:not(.has_data)").html("no data");
		})
	}
	db = $.couch.db("sets");
	db.view("search/by_name",{
		includeDocs : true,
		success : function(resp) {
			$(resp.rows).each(function() {
				set_data[this.key] = this.value
			})
		}
	})
	db = $.couch.db("cards");
	$(searchbox).keyup(function() {
		val = $(this).val();
		if (!val.length) {
			$(search_results).hide();
			return false;
		}

		db.view("search/by_name",{
			startkey : val,
			endkey : val+"\ufff0",
			limit : 8,
			success : function(resp) {
				render_search_results(resp.rows);
			}
		});
	}).focus();
	$(search_results).click(function(event) {
		var selected_id = $(event.target).data("id"),
			card;
		db.openDoc(selected_id,{
			success : function(resp) {
				card = resp;
				render_card_data(card);
			}
		})
	})
}(jQuery))