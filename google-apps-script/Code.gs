/**
 * INAM TECH ZONE Commerce API 2.2
 * Run setupStore(email, password) once, then deploy as a Web app.
 * Execute as: Me. Access: Anyone.
 */

const STORE_SHEETS = {
  Products: ['id','slug','name','category','price','comparePrice','stock','sku','status','badge','rating','reviews','color','featured','image','gallery','description','details','updatedAt','brand','model','warranty','leadTime'],
  Orders: ['id','date','customer','email','total','status','payment','items','coupon','payload','updatedAt','trackingNumber','courier','estimatedDelivery','timeline'],
  Quotes: ['id','date','customer','company','email','phone','projectType','product','productId','productLabel','quantity','message','status','updatedAt'],
  Categories: ['id','name','slug','active','updatedAt'],
  Customers: ['id','name','email','orders','spent','joined','updatedAt'],
  Coupons: ['code','type','value','active','uses','updatedAt'],
  Settings: ['key','value','updatedAt'],
};

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || 'health');
    if (action === 'bootstrap') return jsonResponse_({ ok: true, ...getBootstrap_() });
    return jsonResponse_({ ok: true, service: 'INAM TECH ZONE Commerce API', version: '2.2.0', configured: Boolean(getProperty_('SPREADSHEET_ID')) });
  } catch (error) { return jsonResponse_({ ok: false, error: error.message }); }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = String(body.action || '');
    if (action === 'login') return jsonResponse_(login_(body.email, body.password));
    if (action === 'createOrder') return jsonResponse_(createOrder_(body.order));
    if (action === 'createQuote') return jsonResponse_(createQuote_(body.quote));
    if (action === 'trackOrder') return jsonResponse_(trackOrder_(body.orderId, body.email));
    requireAdmin_(body.token);
    if (action === 'getAdminData') return jsonResponse_(getAdminData_());
    if (action === 'initializeCatalog') return jsonResponse_(initializeCatalog_(body));
    if (action === 'saveProduct') return jsonResponse_(saveProduct_(body.product));
    if (action === 'deleteProduct') return jsonResponse_(deleteProduct_(body.productId));
    if (action === 'saveCategory') return jsonResponse_(saveCategory_(body.category));
    if (action === 'saveCoupon') return jsonResponse_(saveCoupon_(body.coupon));
    if (action === 'updateQuote') return jsonResponse_(updateQuote_(body.quoteId, body.status));
    if (action === 'deleteOrder') return jsonResponse_(deleteOrder_(body.orderId));
    if (action === 'deleteQuote') return jsonResponse_(deleteRecord_('Quotes', 'id', body.quoteId));
    if (action === 'deleteCategory') return jsonResponse_(deleteRecord_('Categories', 'id', body.categoryId));
    if (action === 'deleteCustomer') return jsonResponse_(deleteRecord_('Customers', 'id', body.customerId));
    if (action === 'deleteCoupon') return jsonResponse_(deleteRecord_('Coupons', 'code', body.code));
    if (action === 'saveSettings') return jsonResponse_(saveSettings_(body.settings));
    if (action === 'updateOrder') return jsonResponse_(updateOrder_(body.orderId, body.status));
    if (action === 'updateOrderDetails') return jsonResponse_(updateOrderDetails_(body.order));
    if (action === 'uploadImage') return jsonResponse_(uploadImage_(body));
    throw new Error('Unknown action.');
  } catch (error) { return jsonResponse_({ ok: false, error: error.message }); }
}

function setupStore(adminEmail, adminPassword) {
  if (!adminEmail || !adminPassword || String(adminPassword).length < 10) throw new Error('Use an administrator email and password with at least 10 characters.');
  const props = PropertiesService.getScriptProperties();
  let spreadsheetId = props.getProperty('SPREADSHEET_ID');
  const spreadsheet = spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : SpreadsheetApp.create('INAM TECH ZONE Commerce Database');
  spreadsheetId = spreadsheet.getId();
  props.setProperty('SPREADSHEET_ID', spreadsheetId);
  Object.keys(STORE_SHEETS).forEach(function(name) { ensureSheet_(spreadsheet, name, STORE_SHEETS[name]); });
  const blank = spreadsheet.getSheetByName('Sheet1');
  if (blank && spreadsheet.getSheets().length > 1) spreadsheet.deleteSheet(blank);
  let folderId = props.getProperty('DRIVE_FOLDER_ID');
  if (!folderId) { const folder = DriveApp.createFolder('INAM TECH ZONE Product Media'); folderId = folder.getId(); props.setProperty('DRIVE_FOLDER_ID', folderId); }
  const salt = Utilities.getUuid();
  props.setProperties({
    ADMIN_EMAIL: String(adminEmail).trim().toLowerCase(),
    ADMIN_SALT: salt,
    ADMIN_PASSWORD_HASH: hash_(salt + String(adminPassword)),
    TOKEN_SECRET: Utilities.getUuid() + Utilities.getUuid(),
  });
  return { spreadsheetUrl: spreadsheet.getUrl(), spreadsheetId: spreadsheetId, driveFolderId: folderId };
}

function getBootstrap_() {
  const settings = publicSettings_();
  return {
    products: readObjects_('Products').map(parseProduct_),
    categories: readObjects_('Categories').map(normalizeBooleans_),
    coupons: readObjects_('Coupons').map(normalizeBooleans_).filter(function(item) { return item.active !== false; }),
    settings: settings,
    syncMeta: { catalogInitialized: catalogInitialized_(), serverTime: new Date().toISOString() },
  };
}

function getAdminData_() {
  return {
    ok: true,
    products: readObjects_('Products').map(parseProduct_),
    categories: readObjects_('Categories').map(normalizeBooleans_),
    orders: readObjects_('Orders').map(parseOrder_),
    customers: readObjects_('Customers'),
    quotes: readObjects_('Quotes'),
    coupons: readObjects_('Coupons').map(normalizeBooleans_),
    settings: publicSettings_(),
    syncMeta: { catalogInitialized: catalogInitialized_(), serverTime: new Date().toISOString() },
  };
}

function login_(email, password) {
  const normalized = String(email || '').trim().toLowerCase();
  const salt = getProperty_('ADMIN_SALT');
  if (!salt || !getProperty_('ADMIN_PASSWORD_HASH')) throw new Error('Run setupStore() first.');
  if (normalized !== getProperty_('ADMIN_EMAIL') || hash_(salt + String(password || '')) !== getProperty_('ADMIN_PASSWORD_HASH')) throw new Error('Email or password is incorrect.');
  const expiry = Date.now() + 8 * 60 * 60 * 1000;
  const content = normalized + '|' + expiry;
  return { ok: true, token: Utilities.base64EncodeWebSafe(content + '|' + sign_(content)), expiresAt: expiry };
}

function requireAdmin_(token) {
  if (!token) throw new Error('Administrator authorization required.');
  let decoded = '';
  try { decoded = Utilities.newBlob(Utilities.base64DecodeWebSafe(String(token))).getDataAsString(); }
  catch (error) { throw new Error('Invalid administrator token.'); }
  const parts = decoded.split('|');
  if (parts.length !== 3 || Number(parts[1]) < Date.now() || sign_(parts[0] + '|' + parts[1]) !== parts[2] || parts[0] !== getProperty_('ADMIN_EMAIL')) throw new Error('Administrator session expired.');
}

function initializeCatalog_(body) {
  if (catalogInitialized_()) return { ok: true, initialized: false };
  (body.products || []).forEach(saveProduct_);
  (body.categories || []).forEach(saveCategory_);
  (body.coupons || []).forEach(saveCoupon_);
  markCatalogInitialized_();
  return { ok: true, initialized: true };
}

function saveProduct_(product) {
  if (!product || !product.id || !product.name || !product.sku) throw new Error('Product ID, name and SKU are required.');
  const images = [product.image].concat(product.gallery || []).filter(function(url, index, list) { return Boolean(url) && list.indexOf(url) === index; }).slice(0, 6);
  if (!images.length) throw new Error('At least one product image is required.');
  const row = { ...product, image: images[0], gallery: JSON.stringify(images.slice(1)), details: JSON.stringify(product.details || []), updatedAt: new Date().toISOString() };
  upsertObject_('Products', 'id', product.id, row);
  markCatalogInitialized_();
  return { ok: true, product: product };
}

function deleteProduct_(id) { const result = deleteRecord_('Products', 'id', id); markCatalogInitialized_(); return result; }

function saveCategory_(category) {
  if (!category || !category.id || !category.name) throw new Error('Category ID and name are required.');
  const row = { id: clean_(category.id, 80), name: clean_(category.name, 120), slug: clean_(category.slug || String(category.name).toLowerCase().replace(/\W+/g, '-'), 140), active: Boolean(category.active), updatedAt: new Date().toISOString() };
  upsertObject_('Categories', 'id', row.id, row); markCatalogInitialized_(); return { ok: true, category: row };
}

function saveCoupon_(coupon) {
  if (!coupon || !coupon.code) throw new Error('Promotion code is required.');
  if (['percent','fixed','shipping'].indexOf(coupon.type) < 0) throw new Error('Invalid promotion type.');
  const row = { code: clean_(coupon.code, 40).toUpperCase(), type: coupon.type, value: Math.max(0, Number(coupon.value || 0)), active: Boolean(coupon.active), uses: Math.max(0, Number(coupon.uses || 0)), updatedAt: new Date().toISOString() };
  upsertObject_('Coupons', 'code', row.code, row); markCatalogInitialized_(); return { ok: true, coupon: row };
}

function createOrder_(order) {
  if (!order || !order.email || !order.customer || !Number(order.total)) throw new Error('Order data is incomplete.');
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sheet = getSheet_('Orders');
    const id = nextOrderId_(sheet);
    const row = { id: id, date: new Date().toISOString().slice(0,10), customer: clean_(order.customer,120), email: clean_(order.email,160), total: Number(order.total), status: 'Processing', payment: clean_(order.payment || 'Pending',30), items: Number(order.items || 0), coupon: clean_(order.coupon || '',40), payload: JSON.stringify(order), updatedAt: new Date().toISOString(), trackingNumber: '', courier: '', estimatedDelivery: '', timeline: JSON.stringify([{ stage:'Confirmed', date:new Date().toISOString(), note:'Order received.' }]) };
    appendObject_(sheet, STORE_SHEETS.Orders, row); upsertCustomer_(order, row); adjustInventory_(order.lines || []);
    return { ok: true, orderId: id };
  } finally { lock.releaseLock(); }
}

function createQuote_(quote) {
  if (!quote || !quote.customer || !quote.email || !quote.phone) throw new Error('Name, email and phone are required.');
  const row = { id: clean_(quote.id || ('QT-' + Utilities.getUuid().slice(0,8).toUpperCase()),40), date: clean_(quote.date || new Date().toISOString().slice(0,10),20), customer: clean_(quote.customer,120), company: clean_(quote.company,120), email: clean_(quote.email,160), phone: clean_(quote.phone,60), projectType: clean_(quote.projectType,100), product: clean_(quote.product,180), productId: clean_(quote.productId,80), productLabel: clean_(quote.productLabel,180), quantity: Math.max(1,Number(quote.quantity || 1)), message: clean_(quote.message,2000), status:'New', updatedAt:new Date().toISOString() };
  appendObject_(getSheet_('Quotes'), STORE_SHEETS.Quotes, row); return { ok:true, quoteId:row.id };
}

function trackOrder_(orderId, email) {
  const id = clean_(orderId,60).toLowerCase(); const normalized = clean_(email,160).toLowerCase();
  const found = readObjects_('Orders').filter(function(item) { return String(item.id).toLowerCase() === id && String(item.email).toLowerCase() === normalized; })[0];
  if (!found) throw new Error('Order not found. Check the order ID and email address.');
  const order = parseOrder_(found);
  return { ok:true, order:{ id:order.id,date:order.date,status:order.status,items:order.items,total:order.total,courier:order.courier || '',trackingNumber:order.trackingNumber || '',estimatedDelivery:order.estimatedDelivery || '',timeline:order.timeline || [] } };
}

function updateQuote_(id, status) {
  if (['New','Contacted','Quoted','Won','Closed'].indexOf(status) < 0) throw new Error('Invalid quote status.');
  const quote = findRecord_('Quotes','id',id); if (!quote) throw new Error('Quote not found.');
  quote.status = status; quote.updatedAt = new Date().toISOString(); upsertObject_('Quotes','id',id,quote); return { ok:true, quoteId:id, status:status };
}

function updateOrder_(id, status) {
  if (['Processing','On hold','Packed','Shipped','Delivered','Cancelled'].indexOf(status) < 0) throw new Error('Invalid order status.');
  const order = findRecord_('Orders','id',id); if (!order) throw new Error('Order not found.');
  let timeline = []; try { timeline = JSON.parse(order.timeline || '[]'); } catch (error) {}
  order.status = status; order.updatedAt = new Date().toISOString(); timeline.push({stage:status,date:order.updatedAt,note:'Status updated by administrator.'}); order.timeline = JSON.stringify(timeline);
  upsertObject_('Orders','id',id,order); return { ok:true };
}

function updateOrderDetails_(draft) {
  if (!draft || !draft.id) throw new Error('Order ID is required.');
  const order = findRecord_('Orders','id',draft.id); if (!order) throw new Error('Order not found.');
  if (['Processing','On hold','Packed','Shipped','Delivered','Cancelled'].indexOf(draft.status) < 0) throw new Error('Invalid order status.');
  order.status=draft.status; order.trackingNumber=clean_(draft.trackingNumber || '',100); order.courier=clean_(draft.courier || '',100); order.estimatedDelivery=clean_(draft.estimatedDelivery || '',30); order.timeline=JSON.stringify(draft.timeline || []); order.payload=JSON.stringify(draft); order.updatedAt=new Date().toISOString();
  upsertObject_('Orders','id',draft.id,order); return { ok:true, order:draft };
}

function deleteOrder_(id) { const order=findRecord_('Orders','id',id); if(!order) throw new Error('Order not found.'); const result=deleteRecord_('Orders','id',id); recalculateCustomer_(order.email); return result; }

function saveSettings_(settings) {
  Object.keys(settings || {}).forEach(function(key) { if (['adminEmail','apiEndpoint'].indexOf(key) >= 0) return; upsertObject_('Settings','key',key,{key:key,value:JSON.stringify(settings[key]),updatedAt:new Date().toISOString()}); });
  return { ok:true };
}

function uploadImage_(body) {
  if (!body.dataUrl || String(body.dataUrl).length > 9000000) throw new Error('Image is missing or too large. Keep uploads below 6 MB.');
  const parts=String(body.dataUrl).split(','); const blob=Utilities.newBlob(Utilities.base64Decode(parts.pop()),body.mimeType || 'image/jpeg',clean_(body.fileName || 'product-image.jpg',120));
  const file=DriveApp.getFolderById(getProperty_('DRIVE_FOLDER_ID')).createFile(blob); file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
  return { ok:true,fileId:file.getId(),url:'https://drive.google.com/uc?export=view&id=' + file.getId() };
}

function deleteRecord_(sheetName,keyName,keyValue) {
  if(!keyValue) throw new Error('A record ID is required.'); const sheet=getSheet_(sheetName); const values=sheet.getDataRange().getValues(); const column=(values[0] || []).indexOf(keyName); if(column < 0) throw new Error('Record key column was not found.');
  let deleted=false; for(let row=values.length-1;row>=1;row--){if(String(values[row][column])===String(keyValue)){sheet.deleteRow(row+1);deleted=true;}}
  if(!deleted) throw new Error('Record not found.'); if(['Products','Categories','Coupons'].indexOf(sheetName)>=0) markCatalogInitialized_(); return {ok:true,deleted:String(keyValue)};
}

function recalculateCustomer_(email) {
  const normalized=clean_(email,160).toLowerCase(); const customer=readObjects_('Customers').filter(function(item){return String(item.email).toLowerCase()===normalized;})[0]; if(!customer) return;
  const orders=readObjects_('Orders').filter(function(item){return String(item.email).toLowerCase()===normalized;}); customer.orders=orders.length; customer.spent=orders.reduce(function(total,item){return total+Number(item.total || 0);},0); customer.updatedAt=new Date().toISOString(); upsertObject_('Customers','id',customer.id,customer);
}

function upsertCustomer_(order,saved) {
  const email=clean_(order.email,160).toLowerCase(); const current=readObjects_('Customers').filter(function(item){return String(item.email).toLowerCase()===email;})[0];
  const record=current || {id:'CUS-'+Utilities.getUuid().slice(0,8).toUpperCase(),name:saved.customer,email:email,orders:0,spent:0,joined:new Date().toISOString().slice(0,10)}; record.orders=Number(record.orders || 0)+1; record.spent=Number(record.spent || 0)+Number(saved.total || 0); record.updatedAt=new Date().toISOString(); upsertObject_('Customers','id',record.id,record);
}

function adjustInventory_(lines) {
  const products=readObjects_('Products'); (lines || []).forEach(function(line){const product=products.filter(function(item){return String(item.id)===String(line.id);})[0]; if(!product)return; product.stock=Math.max(0,Number(product.stock || 0)-Number(line.qty || 0)); product.updatedAt=new Date().toISOString(); upsertObject_('Products','id',product.id,product);});
}

function publicSettings_(){const settings=readSettings_(); delete settings.adminEmail; delete settings.driveFolderId; delete settings.apiEndpoint; return settings;}
function readSettings_(){const result={}; readObjects_('Settings').forEach(function(row){try{result[row.key]=JSON.parse(row.value);}catch(error){result[row.key]=row.value;}}); return result;}
function catalogInitialized_(){if(getProperty_('CATALOG_INITIALIZED')==='true')return true; const ready=['Products','Categories','Coupons'].some(function(name){return getSheet_(name).getLastRow()>1;}); if(ready)markCatalogInitialized_(); return ready;}
function markCatalogInitialized_(){PropertiesService.getScriptProperties().setProperty('CATALOG_INITIALIZED','true');}
function findRecord_(sheet,key,value){return readObjects_(sheet).filter(function(item){return String(item[key])===String(value);})[0];}
function readObjects_(name){const values=getSheet_(name).getDataRange().getValues(); if(values.length<2)return[]; const headers=values[0]; return values.slice(1).filter(function(row){return row.some(function(cell){return cell!=='';});}).map(function(row){const item={}; headers.forEach(function(header,index){item[header]=row[index];}); return item;});}
function upsertObject_(sheetName,keyName,keyValue,object){const sheet=getSheet_(sheetName); const headers=STORE_SHEETS[sheetName]; const values=sheet.getDataRange().getValues(); const keyColumn=headers.indexOf(keyName); let target=-1; for(let i=1;i<values.length;i++)if(String(values[i][keyColumn])===String(keyValue))target=i+1; const row=headers.map(function(header){return object[header]===undefined?'':object[header];}); if(target>0)sheet.getRange(target,1,1,headers.length).setValues([row]); else sheet.appendRow(row);}
function appendObject_(sheet,headers,object){sheet.appendRow(headers.map(function(header){return object[header]===undefined?'':object[header];}));}
function getSheet_(name){const spreadsheet=SpreadsheetApp.openById(getProperty_('SPREADSHEET_ID')); return ensureSheet_(spreadsheet,name,STORE_SHEETS[name]);}
function ensureSheet_(spreadsheet,name,headers){let sheet=spreadsheet.getSheetByName(name); if(!sheet)sheet=spreadsheet.insertSheet(name); if(sheet.getLastRow()===0)sheet.appendRow(headers); else {const existing=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0]; headers.forEach(function(header){if(existing.indexOf(header)>=0)return; sheet.getRange(1,sheet.getLastColumn()+1).setValue(header); existing.push(header);});} sheet.setFrozenRows(1); return sheet;}
function parseProduct_(item){item=normalizeBooleans_(item); ['price','comparePrice','stock','rating','reviews'].forEach(function(key){item[key]=Number(item[key] || 0);}); ['gallery','details'].forEach(function(key){try{item[key]=JSON.parse(item[key] || '[]');}catch(error){item[key]=[];}}); return item;}
function parseOrder_(item){let payload={};let timeline=[];try{payload=JSON.parse(item.payload || '{}');}catch(error){}try{timeline=JSON.parse(item.timeline || '[]');}catch(error){timeline=payload.timeline || [];}return{...payload,...item,total:Number(item.total || payload.total || 0),items:Number(item.items || payload.items || 0),timeline:timeline};}
function normalizeBooleans_(item){Object.keys(item).forEach(function(key){if(item[key]==='true')item[key]=true;if(item[key]==='false')item[key]=false;});return item;}
function nextOrderId_(sheet){return 'ITZ-' + (1000 + Math.max(1,sheet.getLastRow()));}
function getProperty_(name){return PropertiesService.getScriptProperties().getProperty(name);}
function clean_(value,max){return String(value==null?'':value).replace(/[<>]/g,'').slice(0,max);}
function hash_(value){return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value,Utilities.Charset.UTF_8));}
function sign_(value){return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(value,getProperty_('TOKEN_SECRET')));}
function jsonResponse_(data){return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);}
