<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\Transaction;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request, InventoryService $inventory)
    {
        $filterType = $request->input('filter_type', 'monthly');
        $filterValue = $request->input('filter_value');

        if (!$filterValue) {
            $filterValue = $filterType === 'monthly' ? Carbon::now()->format('Y-m') : Carbon::now()->format('Y');
        }

        $activeBatches = Transaction::with('medicine')->where('type', 'in')->where('stock_remain', '>', 0)->get()->map(function ($batch) {
            return [
                'id' => $batch->id, 
                'medicine_name' => $batch->medicine->name ?? 'N/A',
                'stock_remain' => $batch->stock_remain, 
                'expired_date' => $batch->expired_date,
            ];
        });

        $lowStockMedicines = Medicine::whereColumn('stock', '<', 'minimum_stock')->get();

        return Inertia::render('Dashboard/Index', [
            'auth' => ['user' => auth()->user()],
            'financials' => $inventory->getProfitLoss($filterType, $filterValue),
            'activeBatches' => $activeBatches,
            'allMedicines' => Medicine::orderBy('name', 'asc')->get(),
            'lowStockMedicines' => $lowStockMedicines,
            'filters' => ['filter_type' => $filterType, 'filter_value' => $filterValue]
        ]);
    }

    public function exportCsv(Request $request)
    {
        if (auth()->user()->role !== 'owner') abort(403, 'Unauthorized');

        $filterType = $request->query('filter_type', 'monthly');
        $filterValue = $request->query('filter_value');

        $query = Transaction::with('medicine')->where('type', 'out');
        $period = 'monthly';

        if ($filterType === 'yearly' && $filterValue) {
            $query->whereYear('transaction_date', $filterValue);
            $titlePeriode = "TAHUNAN: " . $filterValue;
            $filenameLabel = "Tahunan_" . $filterValue;
            $period = 'yearly';
        } else {
            if ($filterValue && count(explode('-', $filterValue)) === 2) {
                $parts = explode('-', $filterValue);
                $query->whereYear('transaction_date', $parts[0])->whereMonth('transaction_date', $parts[1]);
                $dateObj = Carbon::createFromDate($parts[0], $parts[1], 1);
            } else {
                $query->whereMonth('transaction_date', Carbon::now('Asia/Jakarta')->month)->whereYear('transaction_date', Carbon::now('Asia/Jakarta')->year);
                $dateObj = Carbon::now('Asia/Jakarta');
            }
            $titlePeriode = "BULANAN: " . $dateObj->translatedFormat('F Y');
            $filenameLabel = "Bulanan_" . $dateObj->format('M_Y');
        }

        $transactions = $query->get();

        // 1. Olah Data untuk Laporan Statistik (Harian / Bulanan)
        $chartData = [];
        if ($period === 'yearly') {
            $grouped = $transactions->groupBy(function($tx) {
                return Carbon::parse($tx->transaction_date)->format('M');
            });
            $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            foreach ($months as $m) {
                $monthTxs = $grouped->get($m, collect([]));
                $chartData[] = [
                    'name' => $m,
                    'Pendapatan' => $monthTxs->sum('revenue'),
                    'Modal' => $monthTxs->sum('capital'),
                    'Laba' => $monthTxs->sum('revenue') - $monthTxs->sum('capital'),
                ];
            }
            $statistikTitle = "LAPORAN STATISTIK PER BULAN - " . $filterValue;
            $statistikHeader = "Bulan";
        } else {
            $grouped = $transactions->groupBy(function($tx) {
                return Carbon::parse($tx->transaction_date)->format('d');
            });
            $dateObjChart = $filterValue ? Carbon::parse($filterValue . '-01') : Carbon::now('Asia/Jakarta');
            $daysInMonth = $dateObjChart->daysInMonth;
            
            for ($i = 1; $i <= $daysInMonth; $i++) {
                $dayStr = str_pad($i, 2, '0', STR_PAD_LEFT);
                $dayTxs = $grouped->get($dayStr, collect([]));
                $chartData[] = [
                    'name' => $i . ' ' . $dateObjChart->format('M'),
                    'Pendapatan' => $dayTxs->sum('revenue'),
                    'Modal' => $dayTxs->sum('capital'),
                    'Laba' => $dayTxs->sum('revenue') - $dayTxs->sum('capital'),
                ];
            }
            $statistikTitle = "LAPORAN STATISTIK HARIAN - " . $dateObj->translatedFormat('F Y');
            $statistikHeader = "Tanggal";
        }

        // 2. Olah Data untuk Rincian Transaksi Utama
        $txForTable = $transactions->sortBy(function($tx) {
            return $tx->medicine->name ?? 'Z';
        });
        $medicineTotals = $txForTable->groupBy('medicine_id')->map(function($group) {
            return $group->sum('quantity');
        });

        $filename = "Laporan_Apotek_" . $filenameLabel . ".xls";
        
        header('Content-Type: application/vnd.ms-excel');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        echo '<?xml version="1.0" encoding="utf-8"?>' . "\n";
        echo '<?mso-application progid="Excel.Sheet"?>' . "\n";
        echo '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"';
        echo ' xmlns:o="urn:schemas-microsoft-com:office:office"';
        echo ' xmlns:x="urn:schemas-microsoft-com:office:excel"';
        echo ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"';
        echo ' xmlns:html="http://www.w3.org/TR/REC-html40">' . "\n";
        
        // Pengaturan Gaya Tampilan ExcelXML
        echo ' <Styles>' . "\n";
        echo '  <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/></Style>' . "\n";
        echo '  <Style ss:ID="TitleStyle"><Font ss:FontName="Arial" ss:Size="13" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0F766E" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>' . "\n";
        echo '  <Style ss:ID="HeaderStyle"><Font ss:FontName="Arial" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0D9488" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>' . "\n";
        echo '  <Style ss:ID="HeaderBlueStyle"><Font ss:FontName="Arial" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#2563EB" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>' . "\n";
        echo '  <Style ss:ID="SubHeaderStyle"><Font ss:FontName="Arial" ss:Bold="1" ss:Color="#0F766E"/><Interior ss:Color="#F0FDFA" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>' . "\n";
        echo '  <Style ss:ID="BoldText"><Font ss:FontName="Arial" ss:Bold="1"/></Style>' . "\n";
        echo '  <Style ss:ID="BoldLaba"><Font ss:FontName="Arial" ss:Bold="1" ss:Color="#166534"/><Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/></Style>' . "\n";
        echo '  <Style ss:ID="CenterText"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>' . "\n";
        echo '  <Style ss:ID="RightText"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/></Style>' . "\n";
        echo '  <Style ss:ID="FooterStyle"><Font ss:FontName="Arial" ss:Bold="1"/><Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/></Style>' . "\n";
        echo ' </Styles>' . "\n";

        // =======================================================
        // POSISI BARU SHEET 1: Rincian Transaksi Utama
        // =======================================================
        echo ' <Worksheet ss:Name="Rincian Transaksi">' . "\n";
        echo '  <Table>' . "\n";
        echo '   <Column ss:Width="180"/>' . "\n";
        echo '   <Column ss:Width="100"/>' . "\n";
        echo '   <Column ss:Width="100"/>' . "\n";
        echo '   <Column ss:Width="120"/>' . "\n";
        echo '   <Column ss:Width="100"/>' . "\n";
        echo '   <Column ss:Width="140"/>' . "\n";
        echo '   <Column ss:Width="120"/>' . "\n";
        echo '   <Column ss:Width="120"/>' . "\n";
        echo '   <Column ss:Width="120"/>' . "\n";
        
        echo '   <Row ss:Height="25">' . "\n";
        echo '    <Cell ss:MergeAcross="8" ss:StyleID="TitleStyle"><Data ss:Type="String">RINCIAN DATA TRANSAKSI PENJUALAN OBAT</Data></Cell>' . "\n";
        echo '   </Row>' . "\n";
        echo '   <Row ss:Height="20">' . "\n";
        echo '    <Cell ss:MergeAcross="8" ss:StyleID="SubHeaderStyle"><Data ss:Type="String">Filter Rekap → ' . $titlePeriode . '</Data></Cell>' . "\n";
        echo '   </Row>' . "\n";
        echo '   <Row ss:Height="22">' . "\n";
        echo '    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Nama Obat</Data></Cell>' . "\n";
        echo '    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Tanggal Keluar</Data></Cell>' . "\n";
        echo '    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Jam Transaksi</Data></Cell>' . "\n";
        echo '    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Sisa Stok Gudang</Data></Cell>' . "\n";
        echo '    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Qty Keluar (Tx)</Data></Cell>' . "\n";
        echo '    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Total Terjual (Periode Ini)</Data></Cell>' . "\n";
        echo '    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Pendapatan (Rp)</Data></Cell>' . "\n";
        echo '    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Modal HPP (Rp)</Data></Cell>' . "\n";
        echo '    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Laba Bersih (Rp)</Data></Cell>' . "\n";
        echo '   </Row>' . "\n";
        
        $totalPendapatan = 0; $totalModal = 0; $totalLaba = 0;

        foreach ($txForTable as $t) {
            $laba = $t->revenue - $t->capital;
            $totalPendapatan += $t->revenue; $totalModal += $t->capital; $totalLaba += $laba;
            $jamTx = $t->created_at ? $t->created_at->timezone('Asia/Jakarta')->format('H:i:s') : '00:00:00';
            $sisaStokMaster = $t->medicine->stock ?? 0;
            $akumulasiTerjual = $medicineTotals[$t->medicine_id] ?? 0;

            echo '   <Row>' . "\n";
            echo '    <Cell ss:StyleID="BoldText"><Data ss:Type="String">' . ($t->medicine->name ?? 'Obat Dihapus') . '</Data></Cell>' . "\n";
            echo '    <Cell ss:StyleID="CenterText"><Data ss:Type="String">' . $t->transaction_date . '</Data></Cell>' . "\n";
            echo '    <Cell ss:StyleID="CenterText"><Data ss:Type="String">' . $jamTx . '</Data></Cell>' . "\n";
            echo '    <Cell ss:StyleID="CenterText"><Data ss:Type="Number">' . $sisaStokMaster . '</Data></Cell>' . "\n";
            echo '    <Cell ss:StyleID="CenterText"><Data ss:Type="Number">' . $t->quantity . '</Data></Cell>' . "\n";
            echo '    <Cell ss:StyleID="CenterText"><Data ss:Type="Number">' . $akumulasiTerjual . '</Data></Cell>' . "\n";
            echo '    <Cell ss:StyleID="RightText"><Data ss:Type="Number">' . $t->revenue . '</Data></Cell>' . "\n";
            echo '    <Cell ss:StyleID="RightText"><Data ss:Type="Number">' . $t->capital . '</Data></Cell>' . "\n";
            echo '    <Cell ss:StyleID="RightText"><Data ss:Type="Number">' . $laba . '</Data></Cell>' . "\n";
            echo '   </Row>' . "\n";
        }

        echo '   <Row ss:Height="22">' . "\n";
        echo '    <Cell ss:MergeAcross="5" ss:StyleID="FooterStyle"><Data ss:Type="String">REKAP TOTAL KESELURUHAN:</Data></Cell>' . "\n";
        echo '    <Cell ss:StyleID="FooterStyle"><Data ss:Type="Number">' . $totalPendapatan . '</Data></Cell>' . "\n";
        echo '    <Cell ss:StyleID="FooterStyle"><Data ss:Type="Number">' . $totalModal . '</Data></Cell>' . "\n";
        echo '    <Cell ss:StyleID="FooterStyle"><Data ss:Type="Number">' . $totalLaba . '</Data></Cell>' . "\n";
        echo '   </Row>' . "\n";
        echo '  </Table>' . "\n";
        echo ' </Worksheet>' . "\n";


        // =======================================================
        // POSISI BARU SHEET 2: Laporan Statistik (Sumber Grafik)
        // =======================================================
        echo ' <Worksheet ss:Name="Laporan Statistik">' . "\n";
        echo '  <Table>' . "\n";
        echo '   <Column ss:Width="140"/>' . "\n";
        echo '   <Column ss:Width="140"/>' . "\n";
        echo '   <Column ss:Width="140"/>' . "\n";
        echo '   <Column ss:Width="140"/>' . "\n";
        
        echo '   <Row ss:Height="25">' . "\n";
        echo '    <Cell ss:MergeAcross="3" ss:StyleID="TitleStyle"><Data ss:Type="String">' . $statistikTitle . '</Data></Cell>' . "\n";
        echo '   </Row>' . "\n";
        echo '   <Row ss:Height="20">' . "\n";
        echo '    <Cell ss:StyleID="HeaderBlueStyle"><Data ss:Type="String">' . $statistikHeader . '</Data></Cell>' . "\n";
        echo '    <Cell ss:StyleID="HeaderBlueStyle"><Data ss:Type="String">Pendapatan (Rp)</Data></Cell>' . "\n";
        echo '    <Cell ss:StyleID="HeaderBlueStyle"><Data ss:Type="String">Modal HPP (Rp)</Data></Cell>' . "\n";
        echo '    <Cell ss:StyleID="HeaderBlueStyle"><Data ss:Type="String">Laba Bersih (Rp)</Data></Cell>' . "\n";
        echo '   </Row>' . "\n";
        
        foreach ($chartData as $data) {
            echo '   <Row>' . "\n";
            echo '    <Cell ss:StyleID="CenterText"><Data ss:Type="String">' . $data['name'] . '</Data></Cell>' . "\n";
            echo '    <Cell ss:StyleID="RightText"><Data ss:Type="Number">' . $data['Pendapatan'] . '</Data></Cell>' . "\n";
            echo '    <Cell ss:StyleID="RightText"><Data ss:Type="Number">' . $data['Modal'] . '</Data></Cell>' . "\n";
            echo '    <Cell ss:StyleID="BoldLaba"><Data ss:Type="Number">' . $data['Laba'] . '</Data></Cell>' . "\n";
            echo '   </Row>' . "\n";
        }
        echo '  </Table>' . "\n";
        echo ' </Worksheet>' . "\n";
        
        echo '</Workbook>' . "\n";
        exit;
    }
}