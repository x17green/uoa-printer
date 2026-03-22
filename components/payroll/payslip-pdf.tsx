'use client';

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';
import type { PayslipData } from '@/lib/payslip-generator';

Font.register({ family: 'Inter', src: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap' });

const styles = StyleSheet.create({
  page: {
    paddingTop: 92,
    paddingBottom: 72,
    paddingHorizontal: 24,
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 1.4,
    color: '#222',
  },
  header: {
    position: 'absolute',
    top: 16,
    left: 24,
    right: 24,
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: '#d9d9d9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    width: 48,
    height: 48,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: 700,
  },
  brandSub: {
    fontSize: 9,
    color: '#666',
  },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 24,
    right: 24,
    borderTopWidth: 1,
    borderTopColor: '#d9d9d9',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#666',
  },
  heading: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 10,
  },
  section: {
    marginBottom: 12,
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    width: 'auto',
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCol: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#999',
    paddingBottom: 4,
    paddingRight: 6,
  },
  tableCell: {
    fontSize: 9,
  },
  label: {
    fontWeight: 600,
  },
  subtitle: {
    fontSize: 12,
    marginVertical: 6,
  },
  netPay: {
    fontSize: 14,
    fontWeight: 700,
    marginTop: 8,
  },
});

export interface PayslipPdfProps {
  payslips: PayslipData[];
}

export function createPayslipPdfDocument(payslips: PayslipData[]) {
  return (
    <Document>
      {payslips.map((data, idx) => (
        <Page size="A4" style={styles.page} key={`payslip-page-${idx}`} wrap>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Image
                style={styles.logo}
                src="/logos/university_of_african_logo.png"
              />
              <View>
                <Text style={styles.brandTitle}>University of African</Text>
                <Text style={styles.brandSub}>Payroll Services | Staff Payslip</Text>
              </View>
            </View>
            <View>
              <Text style={{ fontSize: 10, fontWeight: 700 }}>Issued: {new Date().toLocaleDateString()}</Text>
              <Text style={{ fontSize: 8, color: '#666' }}>Run: {data.month}/{data.year}</Text>
            </View>
          </View>

          <View style={styles.footer} fixed>
            <Text>University of African • www.universityofafrican.edu</Text>
            <Text>Page {idx + 1} of {payslips.length}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.heading}>Payslip</Text>
            <Text>Period: {new Date(data.year, data.month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.subtitle}>Employee Information</Text>
            <Text><Text style={styles.label}>Staff Number:</Text> {data.staffNumber}</Text>
            <Text><Text style={styles.label}>Name:</Text> {data.fullName}</Text>
            <Text><Text style={styles.label}>Department:</Text> {data.department}</Text>
            <Text><Text style={styles.label}>Position:</Text> {data.position || '-'}</Text>
          </View>

          <View style={styles.table}>
            <View style={[styles.tableRow, { backgroundColor: '#eee' }]}>
              <View style={[styles.tableCol, { width: '33%' }]}><Text style={[styles.tableCell, styles.label]}>Earnings</Text></View>
              <View style={[styles.tableCol, { width: '33%' }]}><Text style={[styles.tableCell, styles.label]}>Amount</Text></View>
              <View style={[styles.tableCol, { width: '34%' }]}><Text style={[styles.tableCell, styles.label]}>Deductions</Text></View>
            </View>

            {data.earnings.map((item, idx2) => (
              <View style={styles.tableRow} key={`earn-${idx2}`}>
                <View style={[styles.tableCol, { width: '33%' }]}><Text style={styles.tableCell}>{item.name}</Text></View>
                <View style={[styles.tableCol, { width: '33%' }]}><Text style={styles.tableCell}>{item.amount.toFixed(2)}</Text></View>
                {data.deductions[idx2] ? (
                  <View style={[styles.tableCol, { width: '34%' }]}><Text style={styles.tableCell}>{`${data.deductions[idx2].name}: ${data.deductions[idx2].amount.toFixed(2)}`}</Text></View>
                ) : (
                  <View style={[styles.tableCol, { width: '34%' }]}><Text style={styles.tableCell}> </Text></View>
                )}
              </View>
            ))}
          </View>

          <View>
            <Text style={styles.netPay}><Text style={styles.label}>Gross Pay:</Text> {data.grossPay.toFixed(2)}</Text>
            <Text style={styles.netPay}><Text style={styles.label}>Total Deductions:</Text> {data.totalDeductions.toFixed(2)}</Text>
            <Text style={styles.netPay}><Text style={styles.label}>Net Pay:</Text> {data.netPay.toFixed(2)}</Text>
          </View>
        </Page>
      ))}
    </Document>
  );
}
