(function($) {
	var searchbox = $("#MTG-pricing-search"),
		search_results = $("#search_results"),
		pricing_container = $("#pricing_results"),
		db,set_data={},val,params;
	function render_search_results(results) {
		var oResult;
		$(search_results).empty().show();
		$(pricing_container).hide();
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
		$(search_results).hide();
		$(pricing_container).empty().show()
		.append($("<h2 />",{text:card.name+" ("+card.manacost+")"}));
		for (var set in card.sets) {
			$(pricing_container).append(
				$("<div />",{"class":"set","data-set":set_data[set].longname.toLowerCase()}).append(
					$("<img />",{src:set_data[set].imgURL,alt:set}),
					$("<span />",{text:set_data[set].longname}),
					$("<span />",{text:"retrieving...","class":"pricing"})
					
				)
			)
		}
		$(searchbox).val("");
		$.getJSON("http://blacklotusproject.com/json/?cards="+((card.name).replace(/\s/g,"+")),function(data){
			$(data.cards).each(function() {
				var set = this.url.split("/")[4].replace(/\+/g," ").replace("%3A",":").toLowerCase();
				$("div[data-set='"+set+"'] span.pricing").html("$"+this.low).addClass("has_data");
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
			render_search_results([]);
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