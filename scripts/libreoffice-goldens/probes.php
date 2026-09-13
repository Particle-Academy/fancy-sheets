<?php

declare(strict_types=1);

// Writes the three probe workbooks build.mjs hands to LibreOffice, through
// holy-sheet (the writer this package's model is shared with), and prints what
// each column and row stands for as JSON.
//
//   php probes.php <holy-sheet checkout> <out dir>
//
// display.xlsx  holy-sheet's own number formats over awkward values: what a
//               formatted cell SHOWS once exported.
// text.xlsx     =TEXT(value, code) for a spread of format codes.
// datetime.xlsx the date and time functions, one formula per row.

require $argv[1].'/vendor/autoload.php';

use HolySheet\Agent;
use HolySheet\Workbook\CellFormat;
use HolySheet\Writer\Format\NumFmtBuilder;

$out = rtrim($argv[2], '/\\');

// ---------------------------------------------------------------- display
$displayValues = [1250000.5, 0.184, -1234.567, 1.005, 2.675, 0.5, -0.4, 0, 999.995, 123456789.125, -0.004, 1.45, 2.5, -2.5, 0.125, 1234.5];

// [holy-sheet column, the fancy-sheets CellFormat holy-sheet normalises it to]
$displayColumns = [
    [['header' => 'number0', 'type' => 'integer'], ['displayFormat' => 'number', 'decimals' => 0]],
    [['header' => 'number2', 'type' => 'number', 'decimals' => 2], ['displayFormat' => 'number', 'decimals' => 2]],
    [['header' => 'usd', 'type' => 'currency', 'currency' => 'USD'], ['displayFormat' => 'currency', 'currency' => 'USD']],
    [['header' => 'eur0', 'type' => 'currency', 'currency' => 'EUR', 'decimals' => 0], ['displayFormat' => 'currency', 'decimals' => 0, 'currency' => 'EUR']],
    [['header' => 'chf', 'type' => 'currency', 'currency' => 'CHF'], ['displayFormat' => 'currency', 'currency' => 'CHF']],
    [['header' => 'xyz', 'type' => 'currency', 'currency' => 'XYZ'], ['displayFormat' => 'currency', 'currency' => 'XYZ']],
    [['header' => 'aud', 'type' => 'currency', 'currency' => 'AUD'], ['displayFormat' => 'currency', 'currency' => 'AUD']],
    [['header' => 'pct1', 'type' => 'percent', 'decimals' => 1], ['displayFormat' => 'percentage', 'decimals' => 1]],
    [['header' => 'pct0', 'type' => 'percent', 'decimals' => 0], ['displayFormat' => 'percentage', 'decimals' => 0]],
    [['header' => 'pct3', 'type' => 'percent', 'decimals' => 3], ['displayFormat' => 'percentage', 'decimals' => 3]],
];

Agent::write(['sheets' => [[
    'name' => 'display',
    'columns' => array_column($displayColumns, 0),
    'rows' => array_map(fn ($v) => array_fill(0, count($displayColumns), $v), $displayValues),
]]], "{$out}/display.xlsx");

$display = [
    'values' => $displayValues,
    'columns' => array_map(fn ($c) => [
        'header' => $c[0]['header'],
        'format' => $c[1],
        // Holy Sheet defaults decimals in its normaliser; the code is built from what it stores.
        'code' => NumFmtBuilder::build(new CellFormat(
            displayFormat: $c[1]['displayFormat'],
            decimals: $c[1]['decimals'] ?? ($c[1]['displayFormat'] === 'currency' ? 2 : null),
            currency: $c[1]['currency'] ?? null,
        )),
    ], $displayColumns),
];

// ---------------------------------------------------------------- TEXT()
$textValues = [1234.567, -1234.567, 0, 0.5, -0.4, 45123.75, 1234567.891, 0.00123, 5, 12.5, 123456789, 2.675, 45123.9999999, 1.005];
$textCodes = [
    '0', '0.00', '#,##0', '#,##0.00', '$#,##0.00', '0%', '0.0%', '0.00E+00', '000', '#.##', '0.##',
    '#,##0;(#,##0)', '0.00;-0.00;"zero"', '"Total: "#,##0', '#,##0,', '0.0,,"M"', '\$0.00', '0.0 "kg"', '000-00-0000',
    'yyyy-mm-dd', 'mm/dd/yyyy', 'd-mmm-yy', 'dddd', 'mmmm d, yyyy', 'ddd', 'h:mm AM/PM', 'hh:mm:ss', 'h:mm A/P',
    'yyyy-mm-dd hh:mm:ss', 'mm:ss', 'General', '@',
];

$textColumns = [['header' => 'value', 'type' => 'number']];
foreach ($textCodes as $i => $code) {
    $textColumns[] = ['header' => "c{$i}", 'type' => 'string'];
}
$textRows = [];
foreach ($textValues as $r => $value) {
    $row = [$value];
    foreach ($textCodes as $code) {
        $row[] = '=TEXT(A'.($r + 2).',"'.str_replace('"', '""', $code).'")';
    }
    $textRows[] = $row;
}
Agent::write(['sheets' => [['name' => 'text', 'columns' => $textColumns, 'rows' => $textRows]]], "{$out}/text.xlsx");

// ---------------------------------------------------------------- date functions
$formulas = [
    'DATE(2023,7,16)', 'DATE(2023,1,16)', 'DATE(2023,13,1)', 'DATE(2023,0,1)', 'DATE(2023,2,30)', 'DATE(2024,2,29)',
    'DATE(1899,12,31)', 'DATE(1900,1,1)', 'DATE(1929,1,1)', 'DATE(2023.9,7.9,16.9)',
    'YEAR(45123)', 'MONTH(45123)', 'DAY(45123)', 'YEAR(44927)', 'MONTH(44927)', 'DAY(44927)',
    'WEEKDAY(45123)', 'WEEKDAY(45123,2)', 'WEEKDAY(45123,3)', 'WEEKDAY(45127)', 'WEEKDAY(45127,2)', 'WEEKDAY(45127,3)',
    'WEEKDAY(45123,11)', 'WEEKDAY(45123,12)', 'WEEKDAY(45123,16)', 'WEEKDAY(45123,17)', 'WEEKDAY(45127,13)',
    'HOUR(2.675)', 'MINUTE(2.675)', 'SECOND(2.675)', 'HOUR(1.005)', 'MINUTE(1.005)', 'SECOND(1.005)',
    'HOUR(45123.9999999)', 'MINUTE(45123.9999999)', 'SECOND(45123.9999999)', 'SECOND(1234.567)', 'HOUR(0.75)',
    'EDATE(DATE(2023,1,31),1)', 'EDATE(DATE(2024,1,31),1)', 'EDATE(DATE(2024,3,31),-1)', 'EDATE(DATE(2023,7,16),6)',
    'EDATE(DATE(2023,7,16),-18)', 'EDATE(45123.75,1)',
    'DATEDIF(DATE(2023,1,31),DATE(2023,2,1),"M")', 'DATEDIF(DATE(2023,1,31),DATE(2023,2,28),"M")',
    'DATEDIF(DATE(2023,1,15),DATE(2023,3,15),"M")', 'DATEDIF(DATE(2022,12,31),DATE(2023,12,30),"M")',
    'DATEDIF(DATE(2020,2,29),DATE(2021,2,28),"Y")', 'DATEDIF(DATE(2023,1,15),DATE(2024,1,15),"Y")',
    'DATEDIF(DATE(2023,1,16),DATE(2024,1,15),"Y")', 'DATEDIF(DATE(2023,1,15),DATE(2023,3,15),"D")',
    'DATEDIF(45123.9,45124.1,"D")',
];
// Column B is a plain number column, so every result reaches the CSV as a number.
Agent::write(['sheets' => [[
    'name' => 'datetime',
    'columns' => [['header' => 'formula', 'type' => 'string'], ['header' => 'result', 'type' => 'number', 'decimals' => 0]],
    'rows' => array_map(fn ($f) => [['value' => '='.$f], '='.$f], $formulas),
]]], "{$out}/datetime.xlsx");

echo json_encode([
    'display' => $display,
    'text' => ['values' => $textValues, 'codes' => $textCodes],
    'datetime' => ['formulas' => $formulas],
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), "\n";
