// Financial Ratio Analyzer - Main JavaScript File

class FinancialRatioAnalyzer {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentFile = null;
        this.setupEnterNavigation();
    }

    initializeElements() {
        // File upload elements
        this.fileInput = document.getElementById('fileInput');
        this.uploadArea = document.getElementById('uploadArea');
        this.processFileBtn = document.getElementById('processFileBtn');
        this.fileInfo = document.getElementById('fileInfo');
        this.fileName = document.getElementById('fileName');

        // Input fields
        this.inputFields = {
            // Income Statement
            sales: document.getElementById('sales'),
            cogs: document.getElementById('cogs'),
            netIncome: document.getElementById('netIncome'),
            operatingIncome: document.getElementById('operatingIncome'),
            interestExpense: document.getElementById('interestExpense'),
            depreciationAmortization: document.getElementById('depreciationAmortization'),
            
            // Balance Sheet
            cash: document.getElementById('cash'),
            currentAssets: document.getElementById('currentAssets'),
            averageReceivables: document.getElementById('averageReceivables'),
            inventory: document.getElementById('inventory'),
            averageInventory: document.getElementById('averageInventory'),
            currentLiabilities: document.getElementById('currentLiabilities'),
            averagePayables: document.getElementById('averagePayables'),
            totalAssets: document.getElementById('totalAssets'),
            totalLiabilities: document.getElementById('totalLiabilities'),
            totalEquity: document.getElementById('totalEquity'),
            
            // Cash Flow
            cashFromOperations: document.getElementById('cashFromOperations')
        };

        // Buttons and results
        this.calculateBtn = document.getElementById('calculateBtn');
        this.resultsSection = document.getElementById('results');
        this.errorMessage = document.getElementById('errorMessage');

        // Ratio display elements
        this.ratioElements = {
            currentRatio: document.getElementById('currentRatio'),
            quickRatio: document.getElementById('quickRatio'),
            cashRatio: document.getElementById('cashRatio'),
            grossProfitMargin: document.getElementById('grossProfitMargin'),
            netProfitMargin: document.getElementById('netProfitMargin'),
            operatingProfitMargin: document.getElementById('operatingProfitMargin'),
            ebitdaMargin: document.getElementById('ebitdaMargin'),
            roa: document.getElementById('roa'),
            roe: document.getElementById('roe'),
            inventoryTurnover: document.getElementById('inventoryTurnover'),
            totalAssetTurnover: document.getElementById('totalAssetTurnover'),
            receivablesTurnover: document.getElementById('receivablesTurnover'),
            dso: document.getElementById('dso'),
            payablesTurnover: document.getElementById('payablesTurnover'),
            debtToEquityRatio: document.getElementById('debtToEquityRatio'),
            debtRatio: document.getElementById('debtRatio'),
            interestCoverageRatio: document.getElementById('interestCoverageRatio'),
            roce: document.getElementById('roce'),
            ccc: document.getElementById('ccc'),
            operatingCashFlowRatio: document.getElementById('operatingCashFlowRatio')
        };
    }

    bindEvents() {
        // File upload events
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.processFileBtn.addEventListener('click', () => this.processFile());
        
        // Drag and drop events
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Calculate button
        this.calculateBtn.addEventListener('click', () => this.calculateRatios());
        
        // Input formatting
        Object.values(this.inputFields).forEach(input => {
            input.addEventListener('blur', (e) => this.formatNumber(e.target));
        });
    }

    setupEnterNavigation() {
        // Get all input fields in tab order
        const inputs = Array.from(document.querySelectorAll('input[type="text"]')).sort((a, b) => {
            return (a.tabIndex || 0) - (b.tabIndex || 0);
        });

        inputs.forEach((input, index) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    
                    if (e.shiftKey) {
                        // Shift+Enter: go to previous field
                        const prevIndex = index - 1;
                        if (prevIndex >= 0) {
                            inputs[prevIndex].focus();
                            inputs[prevIndex].select();
                        }
                    } else {
                        // Enter: go to next field
                        const nextIndex = index + 1;
                        if (nextIndex < inputs.length) {
                            inputs[nextIndex].focus();
                            inputs[nextIndex].select();
                        } else {
                            // If last field, focus calculate button
                            this.calculateBtn.focus();
                        }
                    }
                }
            });
        });

        // Also allow Enter on calculate button to trigger calculation
        this.calculateBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.calculateRatios();
            }
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        if (!this.uploadArea.contains(e.relatedTarget)) {
            this.uploadArea.classList.remove('dragover');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.fileInput.files = files;
            this.handleFileSelect({ target: this.fileInput });
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        this.currentFile = file;
        this.fileName.textContent = file.name;
        this.fileInfo.classList.remove('hidden');
        this.processFileBtn.disabled = false;
        
        // Show file info with animation
        this.showMessage('تم تحميل الملف بنجاح!', 'success');
    }

    async processFile() {
        if (!this.currentFile) return;

        try {
            this.showLoading('جاري معالجة الملف...');
            
            const fileType = this.currentFile.name.split('.').pop().toLowerCase();
            let data;

            if (fileType === 'csv') {
                data = await this.parseCSV(this.currentFile);
            } else if (fileType === 'xlsx' || fileType === 'xls') {
                data = await this.parseExcel(this.currentFile);
            } else {
                throw new Error('نوع الملف غير مدعوم');
            }

            this.populateFormData(data);
            this.showMessage('تم تعبئة البيانات بنجاح!', 'success');
            
        } catch (error) {
            console.error('File processing error:', error);
            this.showMessage('حدث خطأ في معالجة الملف', 'error');
        } finally {
            this.hideLoading();
        }
    }

    parseCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const csvText = e.target.result;
                    const lines = csvText.split('\n');
                    const headers = lines[0].split(',').map(h => h.trim());
                    const data = {};
                    
                    // Assuming single row of data for simplicity
                    if (lines.length > 1) {
                        const values = lines[1].split(',').map(v => v.trim());
                        
                        headers.forEach((header, index) => {
                            if (values[index]) {
                                data[header] = this.cleanNumber(values[index]);
                            }
                        });
                    }
                    
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read CSV file'));
            reader.readAsText(file);
        });
    }

    parseExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    
                    // Convert to our expected format
                    const processedData = {};
                    if (jsonData.length > 0) {
                        Object.keys(jsonData[0]).forEach(key => {
                            processedData[key] = this.cleanNumber(jsonData[0][key]);
                        });
                    }
                    
                    resolve(processedData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read Excel file'));
            reader.readAsArrayBuffer(file);
        });
    }

    populateFormData(data) {
        // Map CSV headers to our input fields
        const fieldMapping = {
            // Income Statement
            'sales': 'sales',
            'revenue': 'sales',
            'المبيعات': 'sales',
            'cogs': 'cogs',
            'cost_of_goods_sold': 'cogs',
            'تكلفة_المبيعات': 'cogs',
            'net_income': 'netIncome',
            'صافي_الدخل': 'netIncome',
            'operating_income': 'operatingIncome',
            'الربح_التشغيلي': 'operatingIncome',
            'interest_expense': 'interestExpense',
            'مصروف_الفائدة': 'interestExpense',
            'depreciation': 'depreciationAmortization',
            'الاهلاك': 'depreciationAmortization',
            
            // Balance Sheet
            'cash': 'cash',
            'النقدية': 'cash',
            'current_assets': 'currentAssets',
            'الأصول_المتداولة': 'currentAssets',
            'receivables': 'averageReceivables',
            'الذمم_المدينة': 'averageReceivables',
            'inventory': 'inventory',
            'المخزون': 'inventory',
            'average_inventory': 'averageInventory',
            'متوسط_المخزون': 'averageInventory',
            'current_liabilities': 'currentLiabilities',
            'الالتزامات_المتداولة': 'currentLiabilities',
            'payables': 'averagePayables',
            'الذمم_الدائنة': 'averagePayables',
            'total_assets': 'totalAssets',
            'إجمالي_الأصول': 'totalAssets',
            'total_liabilities': 'totalLiabilities',
            'إجمالي_الالتزامات': 'totalLiabilities',
            'equity': 'totalEquity',
            'حقوق_الملكية': 'totalEquity',
            
            // Cash Flow
            'cash_from_operations': 'cashFromOperations',
            'التدفق_النقدي_التشغيلي': 'cashFromOperations'
        };

        Object.keys(data).forEach(key => {
            const normalizedKey = key.toLowerCase().replace(/[_\s]/g, '_');
            const fieldName = fieldMapping[normalizedKey];
            
            if (fieldName && this.inputFields[fieldName] && data[key] !== null) {
                this.inputFields[fieldName].value = this.formatNumberForDisplay(data[key]);
            }
        });
    }

    cleanNumber(value) {
        if (typeof value === 'string') {
            // Remove commas and other non-numeric characters except decimal point
            return parseFloat(value.replace(/[^\d.-]/g, ''));
        }
        return parseFloat(value) || 0;
    }

    formatNumber(input) {
        const value = input.value.replace(/,/g, '');
        if (value !== '') {
            const number = parseFloat(value);
            if (!isNaN(number)) {
                input.value = number.toLocaleString('en-US');
            }
        }
    }

    formatNumberForDisplay(number) {
        return number.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }

    showMessage(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;
        toast.textContent = message;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showLoading(message) {
        this.processFileBtn.disabled = true;
        this.processFileBtn.innerHTML = `<span class="loading-spinner"></span> ${message}`;
    }

    hideLoading() {
        this.processFileBtn.disabled = false;
        this.processFileBtn.textContent = translations[currentLanguage]['processFileBtn'];
    }

    calculateRatios() {
        try {
            // Get all input values
            const values = {};
            Object.keys(this.inputFields).forEach(key => {
                values[key] = this.cleanNumber(this.inputFields[key].value);
            });

            // Derived figures
            const grossProfit = values.sales - values.cogs;
            const ebitda = values.operatingIncome + values.depreciationAmortization;

            // Clear previous results and error
            this.clearResults();
            this.hideError();

            // Show results section
            this.resultsSection.classList.remove('hidden');

            // Calculate and display ratios
            this.calculateLiquidityRatios(values);
            this.calculateProfitabilityRatios(values, grossProfit, ebitda);
            this.calculateActivityRatios(values);
            this.calculateLeverageRatios(values);

            this.showMessage('تم حساب النسب المالية بنجاح!', 'success');

        } catch (error) {
            console.error('Calculation error:', error);
            this.showError();
        }
    }

    calculateLiquidityRatios(values) {
        const currentRatio = values.currentLiabilities !== 0 ? values.currentAssets / values.currentLiabilities : NaN;
        const quickRatio = values.currentLiabilities !== 0 ? (values.currentAssets - values.inventory) / values.currentLiabilities : NaN;
        const cashRatio = values.currentLiabilities !== 0 ? values.cash / values.currentLiabilities : NaN;

        this.displayRatio('currentRatio', currentRatio, false, 2);
        this.displayRatio('quickRatio', quickRatio, false, 2);
        this.displayRatio('cashRatio', cashRatio, false, 2);
    }

    calculateProfitabilityRatios(values, grossProfit, ebitda) {
        const grossProfitMargin = values.sales !== 0 ? grossProfit / values.sales : NaN;
        const netProfitMargin = values.sales !== 0 ? values.netIncome / values.sales : NaN;
        const operatingProfitMargin = values.sales !== 0 ? values.operatingIncome / values.sales : NaN;
        const ebitdaMargin = values.sales !== 0 ? ebitda / values.sales : NaN;
        const roa = values.totalAssets !== 0 ? values.netIncome / values.totalAssets : NaN;
        const roe = values.totalEquity !== 0 ? values.netIncome / values.totalEquity : NaN;

        this.displayRatio('grossProfitMargin', grossProfitMargin, true, 2);
        this.displayRatio('netProfitMargin', netProfitMargin, true, 2);
        this.displayRatio('operatingProfitMargin', operatingProfitMargin, true, 2);
        this.displayRatio('ebitdaMargin', ebitdaMargin, true, 2);
        this.displayRatio('roa', roa, true, 2);
        this.displayRatio('roe', roe, true, 2);
    }

    calculateActivityRatios(values) {
        const inventoryTurnover = values.averageInventory !== 0 ? values.cogs / values.averageInventory : NaN;
        const totalAssetTurnover = values.totalAssets !== 0 ? values.sales / values.totalAssets : NaN;
        const receivablesTurnover = values.averageReceivables !== 0 ? values.sales / values.averageReceivables : NaN;
        const payablesTurnover = values.averagePayables !== 0 ? values.cogs / values.averagePayables : NaN;
        const dso = isNaN(receivablesTurnover) || receivablesTurnover === 0 ? NaN : 365 / receivablesTurnover;

        this.displayRatio('inventoryTurnover', inventoryTurnover, false, 2);
        this.displayRatio('totalAssetTurnover', totalAssetTurnover, false, 2);
        this.displayRatio('receivablesTurnover', receivablesTurnover, false, 2);
        this.displayRatio('dso', dso, false, 2);
        this.displayRatio('payablesTurnover', payablesTurnover, false, 2);
    }

    calculateLeverageRatios(values) {
        const debtToEquityRatio = values.totalEquity !== 0 ? values.totalLiabilities / values.totalEquity : NaN;
        const debtRatio = values.totalAssets !== 0 ? values.totalLiabilities / values.totalAssets : NaN;
        const interestCoverageRatio = values.interestExpense !== 0 ? values.operatingIncome / values.interestExpense : NaN;
        const roce = (values.totalAssets - values.currentLiabilities) !== 0 ? values.operatingIncome / (values.totalAssets - values.currentLiabilities) : NaN;

        // Cash Conversion Cycle (CCC)
        const inventoryTurnover = values.averageInventory !== 0 ? values.cogs / values.averageInventory : NaN;
        const payablesTurnover = values.averagePayables !== 0 ? values.cogs / values.averagePayables : NaN;
        const receivablesTurnover = values.averageReceivables !== 0 ? values.sales / values.averageReceivables : NaN;
        
        const avgDaysInventory = inventoryTurnover === 0 ? NaN : 365 / inventoryTurnover;
        const avgDaysPayables = payablesTurnover === 0 ? NaN : 365 / payablesTurnover;
        const dso = isNaN(receivablesTurnover) || receivablesTurnover === 0 ? NaN : 365 / receivablesTurnover;
        const ccc = isNaN(avgDaysInventory) || isNaN(dso) || isNaN(avgDaysPayables) ? NaN : (avgDaysInventory + dso - avgDaysPayables);

        const operatingCashFlowRatio = values.currentLiabilities !== 0 ? values.cashFromOperations / values.currentLiabilities : NaN;

        this.displayRatio('debtToEquityRatio', debtToEquityRatio, false, 2);
        this.displayRatio('debtRatio', debtRatio, true, 2);
        this.displayRatio('interestCoverageRatio', interestCoverageRatio, false, 2);
        this.displayRatio('roce', roce, true, 2);
        this.displayRatio('ccc', ccc, false, 2);
        this.displayRatio('operatingCashFlowRatio', operatingCashFlowRatio, false, 2);
    }

    displayRatio(id, value, isPercentage = false, decimalPlaces = 2) {
        let formattedValue = 'N/A';
        
        if (!isNaN(value)) {
            const numberValue = value * (isPercentage ? 100 : 1);
            formattedValue = numberValue.toFixed(decimalPlaces) + (isPercentage ? '%' : '');
            
            // Add color coding based on ratio value
            const element = this.ratioElements[id];
            if (element) {
                element.style.color = this.getRatioColor(id, value);
            }
        }
        
        if (this.ratioElements[id]) {
            this.ratioElements[id].textContent = formattedValue;
        }
    }

    getRatioColor(ratioId, value) {
        // Define color coding for different ratios
        const colorSchemes = {
            // Green is better for these ratios
            currentRatio: value > 2 ? '#10b981' : value > 1 ? '#f59e0b' : '#ef4444',
            quickRatio: value > 1 ? '#10b981' : value > 0.5 ? '#f59e0b' : '#ef4444',
            grossProfitMargin: value > 0.4 ? '#10b981' : value > 0.2 ? '#f59e0b' : '#ef4444',
            netProfitMargin: value > 0.15 ? '#10b981' : value > 0.05 ? '#f59e0b' : '#ef4444',
            roe: value > 0.15 ? '#10b981' : value > 0.08 ? '#f59e0b' : '#ef4444',
            interestCoverageRatio: value > 3 ? '#10b981' : value > 1.5 ? '#f59e0b' : '#ef4444',
            
            // Red is better for these ratios (lower is better)
            debtToEquityRatio: value < 0.5 ? '#10b981' : value < 1 ? '#f59e0b' : '#ef4444',
            debtRatio: value < 0.4 ? '#10b981' : value < 0.6 ? '#f59e0b' : '#ef4444',
            dso: value < 45 ? '#10b981' : value < 60 ? '#f59e0b' : '#ef4444',
            ccc: value < 60 ? '#10b981' : value < 90 ? '#f59e0b' : '#ef4444'
        };

        return colorSchemes[ratioId] || '#3b82f6';
    }

    clearResults() {
        Object.values(this.ratioElements).forEach(element => {
            element.textContent = '';
            element.style.color = '';
        });
    }

    showError() {
        this.errorMessage.classList.remove('hidden');
    }

    hideError() {
        this.errorMessage.classList.add('hidden');
    }
}

// Translation System
let currentLanguage = 'ar';

const translations = {
    'ar': {
        'appTitle': 'محلل النسب المالية - أداة متقدمة للتحليل المالي',
        'mainTitle': 'محلل النسب المالية',
        'mainDescription': 'أداة متقدمة لاستخراج النسب المالية من بيانات قوائمك المالية',
        'uploadTitle': 'رفع ملف البيانات المالية',
        'uploadDescription': 'يمكنك رفع ملف CSV أو Excel يحتوي على بياناتك المالية وسيتم تعبئة الحقول تلقائياً',
        'uploadText': 'اسحب وأفلت ملف البيانات هنا أو انقر للاختيار',
        'fileFormats': 'CSV, Excel',
        'processFileBtn': 'معالجة الملف',
        'downloadTemplate': 'تحميل النموذج',
        'fileLoaded': 'تم تحميل الملف بنجاح!',
        
        // Income Statement
        'incomeStatementTitle': 'قائمة الدخل',
        'salesLabel': 'المبيعات',
        'salesPlaceholder': 'أدخل المبيعات',
        'cogsLabel': 'تكلفة البضاعة المباعة',
        'cogsPlaceholder': 'أدخل تكلفة البضاعة المباعة',
        'netIncomeLabel': 'صافي الدخل',
        'netIncomePlaceholder': 'أدخل صافي الدخل',
        'operatingIncomeLabel': 'الربح التشغيلي (EBIT)',
        'operatingIncomePlaceholder': 'أدخل الربح التشغيلي',
        'interestExpenseLabel': 'مصروف الفائدة',
        'interestExpensePlaceholder': 'أدخل مصروف الفائدة',
        'depreciationAmortizationLabel': 'الاهلاك والإطفاء',
        'depreciationAmortizationPlaceholder': 'أدخل الاهلاك والإطفاء',
        
        // Balance Sheet
        'balanceSheetTitle': 'قائمة المركز المالي',
        'cashLabel': 'النقدية',
        'cashPlaceholder': 'أدخل النقدية',
        'currentAssetsLabel': 'الأصول المتداولة',
        'currentAssetsPlaceholder': 'أدخل الأصول المتداولة',
        'averageReceivablesLabel': 'متوسط الذمم المدينة',
        'averageReceivablesPlaceholder': 'أدخل متوسط الذمم المدينة',
        'inventoryLabel': 'المخزون',
        'inventoryPlaceholder': 'أدخل المخزون',
        'averageInventoryLabel': 'متوسط المخزون',
        'averageInventoryPlaceholder': 'أدخل متوسط المخزون',
        'currentLiabilitiesLabel': 'الالتزامات المتداولة',
        'currentLiabilitiesPlaceholder': 'أدخل الالتزامات المتداولة',
        'averagePayablesLabel': 'متوسط الذمم الدائنة',
        'averagePayablesPlaceholder': 'أدخل متوسط الذمم الدائنة',
        'totalAssetsLabel': 'إجمالي الأصول',
        'totalAssetsPlaceholder': 'أدخل إجمالي الأصول',
        'totalLiabilitiesLabel': 'إجمالي الالتزامات',
        'totalLiabilitiesPlaceholder': 'أدخل إجمالي الالتزامات',
        'totalEquityLabel': 'إجمالي حقوق الملكية',
        'totalEquityPlaceholder': 'أدخل إجمالي حقوق الملكية',
        
        // Cash Flow
        'cashFlowTitle': 'قائمة التدفقات النقدية',
        'cashFromOperationsLabel': 'النقدية من الأنشطة التشغيلية',
        'cashFromOperationsPlaceholder': 'أدخل النقدية من الأنشطة التشغيلية',
        
        // Buttons
        'calculateBtn': '🧮 حساب النسب المالية',
        
        // Results
        'resultsTitle': 'النسب المالية المستخرجة',
        'liquidityRatiosTitle': 'نسب السيولة',
        'currentRatioLabel': 'النسبة المتداولة',
        'quickRatioLabel': 'النسبة السريعة',
        'cashRatioLabel': 'نسبة النقدية',
        'profitabilityRatiosTitle': 'نسب الربحية',
        'grossProfitMarginLabel': 'هامش الربح الإجمالي',
        'netProfitMarginLabel': 'هامش صافي الربح',
        'operatingProfitMarginLabel': 'هامش الربح التشغيلي',
        'ebitdaMarginLabel': 'هامش الأرباح قبل الفوائد والضرائب والإهلاك',
        'roaLabel': 'العائد على الأصول (ROA)',
        'roeLabel': 'العائد على حقوق الملكية (ROE)',
        'activityRatiosTitle': 'نسب النشاط',
        'inventoryTurnoverLabel': 'معدل دوران المخزون',
        'totalAssetTurnoverLabel': 'معدل دوران إجمالي الأصول',
        'receivablesTurnoverLabel': 'معدل دوران الذمم المدينة',
        'dsoLabel': 'متوسط فترة التحصيل (DSO)',
        'payablesTurnoverLabel': 'معدل دوران الدائنين',
        'leverageRatiosTitle': 'نسب الرفع والكفاءة',
        'debtToEquityRatioLabel': 'نسبة الدين إلى حقوق الملكية',
        'debtRatioLabel': 'نسبة الدين',
        'interestCoverageRatioLabel': 'تغطية الفوائد',
        'roceLabel': 'العائد على رأس المال العامل (ROCE)',
        'cccLabel': 'دورة التحويل النقدي (CCC)',
        'operatingCashFlowRatioLabel': 'نسبة التدفق النقدي التشغيلي',
        
        // Messages
        'errorMessage': 'الرجاء إدخال أرقام صحيحة في جميع الحقول المطلوبة.',
        
        // Footer
        'footerText': 'محلل النسب المالية ©2025 | تم تطويره بواسطة أ. عمار حسن'
    },
    'en': {
        'appTitle': 'Financial Ratio Analyzer - Advanced Financial Analysis Tool',
        'mainTitle': 'Financial Ratio Analyzer',
        'mainDescription': 'Advanced tool for extracting financial ratios from your financial statements',
        'uploadTitle': 'Upload Financial Data File',
        'uploadDescription': 'You can upload a CSV or Excel file containing your financial data and fields will be auto-filled',
        'uploadText': 'Drag and drop data file here or click to select',
        'fileFormats': 'CSV, Excel',
        'processFileBtn': 'Process File',
        'downloadTemplate': 'Download Template',
        'fileLoaded': 'File loaded successfully!',
        
        // Income Statement
        'incomeStatementTitle': 'Income Statement',
        'salesLabel': 'Sales',
        'salesPlaceholder': 'Enter Sales',
        'cogsLabel': 'Cost of Goods Sold',
        'cogsPlaceholder': 'Enter Cost of Goods Sold',
        'netIncomeLabel': 'Net Income',
        'netIncomePlaceholder': 'Enter Net Income',
        'operatingIncomeLabel': 'Operating Income (EBIT)',
        'operatingIncomePlaceholder': 'Enter Operating Income',
        'interestExpenseLabel': 'Interest Expense',
        'interestExpensePlaceholder': 'Enter Interest Expense',
        'depreciationAmortizationLabel': 'Depreciation & Amortization',
        'depreciationAmortizationPlaceholder': 'Enter Depreciation & Amortization',
        
        // Balance Sheet
        'balanceSheetTitle': 'Balance Sheet',
        'cashLabel': 'Cash',
        'cashPlaceholder': 'Enter Cash',
        'currentAssetsLabel': 'Current Assets',
        'currentAssetsPlaceholder': 'Enter Current Assets',
        'averageReceivablesLabel': 'Average Receivables',
        'averageReceivablesPlaceholder': 'Enter Average Receivables',
        'inventoryLabel': 'Inventory',
        'inventoryPlaceholder': 'Enter Inventory',
        'averageInventoryLabel': 'Average Inventory',
        'averageInventoryPlaceholder': 'Enter Average Inventory',
        'currentLiabilitiesLabel': 'Current Liabilities',
        'currentLiabilitiesPlaceholder': 'Enter Current Liabilities',
        'averagePayablesLabel': 'Average Payables',
        'averagePayablesPlaceholder': 'Enter Average Payables',
        'totalAssetsLabel': 'Total Assets',
        'totalAssetsPlaceholder': 'Enter Total Assets',
        'totalLiabilitiesLabel': 'Total Liabilities',
        'totalLiabilitiesPlaceholder': 'Enter Total Liabilities',
        'totalEquityLabel': 'Total Equity',
        'totalEquityPlaceholder': 'Enter Total Equity',
        
        // Cash Flow
        'cashFlowTitle': 'Cash Flow Statement',
        'cashFromOperationsLabel': 'Cash from Operations',
        'cashFromOperationsPlaceholder': 'Enter Cash from Operations',
        
        // Buttons
        'calculateBtn': '🧮 Calculate Financial Ratios',
        
        // Results
        'resultsTitle': 'Extracted Financial Ratios',
        'liquidityRatiosTitle': 'Liquidity Ratios',
        'currentRatioLabel': 'Current Ratio',
        'quickRatioLabel': 'Quick Ratio',
        'cashRatioLabel': 'Cash Ratio',
        'profitabilityRatiosTitle': 'Profitability Ratios',
        'grossProfitMarginLabel': 'Gross Profit Margin',
        'netProfitMarginLabel': 'Net Profit Margin',
        'operatingProfitMarginLabel': 'Operating Profit Margin',
        'ebitdaMarginLabel': 'EBITDA Margin',
        'roaLabel': 'Return on Assets (ROA)',
        'roeLabel': 'Return on Equity (ROE)',
        'activityRatiosTitle': 'Activity Ratios',
        'inventoryTurnoverLabel': 'Inventory Turnover',
        'totalAssetTurnoverLabel': 'Total Asset Turnover',
        'receivablesTurnoverLabel': 'Receivables Turnover',
        'dsoLabel': 'Days Sales Outstanding (DSO)',
        'payablesTurnoverLabel': 'Payables Turnover',
        'leverageRatiosTitle': 'Leverage & Efficiency Ratios',
        'debtToEquityRatioLabel': 'Debt to Equity Ratio',
        'debtRatioLabel': 'Debt Ratio',
        'interestCoverageRatioLabel': 'Interest Coverage Ratio',
        'roceLabel': 'Return on Capital Employed (ROCE)',
        'cccLabel': 'Cash Conversion Cycle (CCC)',
        'operatingCashFlowRatioLabel': 'Operating Cash Flow Ratio',
        
        // Messages
        'errorMessage': 'Please enter valid numbers in all required fields.',
        
        // Footer
        'footerText': 'Financial Ratio Analyzer ©2025 | Developed by Ammar Hassan'
    }
};

function setLanguage(lang) {
    currentLanguage = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
    
    // Update title
    document.title = translations[lang]['appTitle'];
    
    // Update all translatable elements
    document.querySelectorAll('[data-i18n-key]').forEach(element => {
        const key = element.getAttribute('data-i18n-key');
        if (translations[lang][key]) {
            if (element.tagName === 'INPUT') {
                element.setAttribute('placeholder', translations[lang][key]);
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });

    // Update button texts that were changed during loading
    if (window.financialAnalyzer) {
        window.financialAnalyzer.processFileBtn.textContent = translations[lang]['processFileBtn'];
    }
}

// Global function for number formatting
function formatNumber(input) {
    const value = input.value.replace(/,/g, '');
    if (value !== '') {
        const number = parseFloat(value);
        if (!isNaN(number)) {
            input.value = number.toLocaleString('en-US');
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize analyzer
    window.financialAnalyzer = new FinancialRatioAnalyzer();
    
    // Set default language
    setLanguage('ar');
    
    // Add CSS for loading spinner and animations
    const style = document.createElement('style');
    style.textContent = `
        .loading-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid transparent;
            border-top: 2px solid currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            display: inline-block;
            margin-right: 8px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    console.log('💰 Financial Ratio Analyzer initialized successfully!');
});