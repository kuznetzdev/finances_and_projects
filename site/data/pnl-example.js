/**
 * Сквозной учебный пример ОФР из раздела 3.1 лекции.
 * Ставка 20% дана исключительно в условии примера, не является актуальной ставкой налога РФ.
 * Валовая прибыль УЖЕ включает эффект амортизации, включённой в себестоимость продаж.
 */
export const PNL_TEACHING_EXAMPLE=Object.freeze({
 revenue:2000,
 cogs:1300,
 depreciationInCogs:70,
 sellingAndAdministrative:350,
 depreciationInSellingAndAdministrative:30,
 interest:50,
 exampleTaxRate:.20
});
export const PNL_EXAMPLE_CONCEPTS=Object.freeze(['revenue','cogs','gross','ebit','ebitda','netprofit','depreciation']);

export function calculatePnlExample(data=PNL_TEACHING_EXAMPLE){
 const gross=data.revenue-data.cogs;
 const ebit=gross-data.sellingAndAdministrative;
 const profitBeforeTax=ebit-data.interest;
 const profitTax=profitBeforeTax*data.exampleTaxRate;
 const netprofit=profitBeforeTax-profitTax;
 const depreciationTotal=data.depreciationInCogs+data.depreciationInSellingAndAdministrative;
 const ebitda=ebit+depreciationTotal;
 return {...data,gross,ebit,profitBeforeTax,profitTax,netprofit,depreciationTotal,ebitda,
  grossMargin:gross/data.revenue*100,
  ebitdaMargin:ebitda/data.revenue*100,
  netMargin:netprofit/data.revenue*100};
}
