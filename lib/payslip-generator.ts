export interface PayslipData {
  staffNumber: string;
  fullName: string;
  department: string;
  position?: string;
  month: number;
  year: number;
  basicSalary: number;
  grossPay: number;
  earnings: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  totalDeductions: number;
  netPay: number;
  bankName?: string;
  accountNumber?: string;
}

/**
 * Generates an HTML payslip that can be printed or converted to PDF
 */
export function generatePayslipHTML(data: PayslipData): string {
  const monthYear = new Date(data.year, data.month - 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const totalIncome = data.earnings.reduce((sum, item) => sum + item.amount, 0);
  const totalPay = data.netPay;

  const earningsHTML = data.earnings
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-size: 13px;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: right; font-size: 13px;">${formatCurrency(item.amount)}</td>
    </tr>
  `
    )
    .join('');

  const deductionsHTML = data.deductions
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-size: 13px;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: right; font-size: 13px;">${formatCurrency(item.amount)}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payslip - ${data.fullName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }

        @media print {
            body {
                padding: 0;
                background-color: white;
            }
        }

        .payslip {
            background: white;
            max-width: 850px;
            margin: 0 auto;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            page-break-after: always;
        }

        .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-bottom: 4px solid #fbbf24;
        }

        .header h1 {
            font-size: 24px;
            margin-bottom: 5px;
            font-weight: 600;
        }

        .header p {
            font-size: 12px;
            opacity: 0.9;
        }

        .period-badge {
            display: inline-block;
            background: #fbbf24;
            color: #1e3a8a;
            padding: 6px 12px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 12px;
            margin-top: 10px;
        }

        .employee-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            padding: 20px;
            border-bottom: 1px solid #e0e0e0;
            background-color: #f9f9f9;
        }

        .info-block {
            margin-bottom: 8px;
        }

        .info-label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 0.5px;
        }

        .info-value {
            font-size: 13px;
            color: #1e3a8a;
            font-weight: 500;
            margin-top: 3px;
        }

        .content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            padding: 30px;
        }

        .section {
            display: flex;
            flex-direction: column;
        }

        .section-title {
            font-size: 13px;
            font-weight: 700;
            color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #fbbf24;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        th {
            text-align: left;
            font-weight: 600;
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 8px;
            background-color: #f5f5f5;
        }

        td {
            padding: 8px;
            border-bottom: 1px solid #e0e0e0;
            font-size: 13px;
        }

        .total-row {
            background-color: #f0f0f0;
            font-weight: 600;
            border-top: 2px solid #fbbf24;
        }

        .net-pay-box {
            grid-column: 1 / -1;
            background: linear-gradient(135deg, #065f46 0%, #10b981 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
            margin-top: 20px;
        }

        .net-pay-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            opacity: 0.9;
            margin-bottom: 8px;
        }

        .net-pay-amount {
            font-size: 36px;
            font-weight: 700;
        }

        .footer {
            background-color: #f9f9f9;
            padding: 15px 30px;
            border-top: 1px solid #e0e0e0;
            font-size: 11px;
            color: #666;
            text-align: center;
        }

        @media print {
            .payslip {
                box-shadow: none;
                margin: 0;
                page-break-after: always;
            }
        }
    </style>
</head>
<body>
    <div class="payslip">
        <!-- Header -->
        <div class="header">
            <h1>PAYSLIP</h1>
            <p>University of Africa</p>
            <span class="period-badge">${monthYear}</span>
        </div>

        <!-- Employee Info -->
        <div class="employee-info">
            <div>
                <div class="info-block">
                    <div class="info-label">Staff Number</div>
                    <div class="info-value">${data.staffNumber}</div>
                </div>
                <div class="info-block">
                    <div class="info-label">Employee Name</div>
                    <div class="info-value">${data.fullName}</div>
                </div>
            </div>
            <div>
                <div class="info-block">
                    <div class="info-label">Department</div>
                    <div class="info-value">${data.department}</div>
                </div>
                ${data.position ? `
                <div class="info-block">
                    <div class="info-label">Position</div>
                    <div class="info-value">${data.position}</div>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- Content -->
        <div class="content">
            <!-- Earnings -->
            <div class="section">
                <div class="section-title">Earnings</div>
                <table>
                    <tbody>
                        ${earningsHTML}
                        <tr class="total-row">
                            <td>Gross Pay</td>
                            <td style="text-align: right;">${formatCurrency(data.grossPay)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Deductions -->
            <div class="section">
                <div class="section-title">Deductions</div>
                <table>
                    <tbody>
                        ${deductionsHTML}
                        <tr class="total-row">
                            <td>Total Deductions</td>
                            <td style="text-align: right;">${formatCurrency(data.totalDeductions)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Net Pay Box -->
            <div class="net-pay-box">
                <div class="net-pay-label">Net Pay</div>
                <div class="net-pay-amount">${formatCurrency(data.netPay)}</div>
                <div style="margin-top: 10px; font-size: 12px; opacity: 0.9;">
                    <div><strong>All Lnfr:</strong> ${formatCurrency(totalIncome)}</div>
                    <div><strong>Total Pay:</strong> ${formatCurrency(totalPay)}</div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Generated by Payroll Management System • ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Generates HTML for multiple payslips (for bulk printing)
 */
export function generateBulkPayslipsHTML(payslips: PayslipData[]): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payslips Bulk Print</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
        }

        @media print {
            body {
                background-color: white;
            }
        }
    </style>
</head>
<body>
    ${payslips.map((payslip) => generatePayslipHTML(payslip)).join('\n')}
</body>
</html>
  `;
}
