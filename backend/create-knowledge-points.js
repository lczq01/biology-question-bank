const knowledgePoints = [
  {
    name: '细胞膜的结构',
    description: '<p>细胞膜具有<strong>流动镶嵌模型</strong>结构，主要由磷脂双分子层构成，其中镶嵌着各种蛋白质分子。</p><p>主要特点：</p><ul><li>具有一定的流动性</li><li>具有选择透过性</li><li>载体蛋白和通道蛋白参与物质运输</li></ul>',
    chapter: '第一章 细胞的分子组成'
  },
  {
    name: '光合作用',
    description: '<p><strong>光合作用</strong>是绿色植物利用光能，在叶绿体中把二氧化碳和水转化成葡萄糖，并释放氧气的过程。</p><p>反应式：6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂</p><p>包括：</p><ol><li>光反应阶段</li><li>暗反应阶段（卡尔文循环）</li></ol>',
    chapter: '第二章 细胞代谢'
  },
  {
    name: 'DNA复制',
    description: '<p><strong>DNA复制</strong>是DNA分子在细胞分裂前进行的自我复制过程，遵循<em>半保留复制</em>原则。</p><p>特点：</p><ul><li>双向复制</li><li>半不连续复制</li><li>需要DNA聚合酶、引物等</li><li>具有高保真性</li></ul>',
    chapter: '第三章 遗传信息'
  },
  {
    name: '细胞呼吸',
    description: '<p><strong>细胞呼吸</strong>是细胞通过酶的催化作用，把糖类等有机物彻底氧化分解，产生ATP的过程。</p><p>包括三个阶段：</p><ol><li>糖酵解（细胞质基质）</li><li>柠檬酸循环（线粒体基质）</li><li>电子传递链（线粒体内膜）</li></ol>',
    chapter: '第二章 细胞代谢'
  },
  {
    name: '基因表达',
    description: '<p><strong>基因表达</strong>是指基因中的遗传信息转录成RNA，再翻译成蛋白质的过程。</p><p>包括：</p><ul><li><strong>转录</strong>：DNA → mRNA</li><li><strong>翻译</strong>：mRNA → 蛋白质</li></ul><p>遵循<em>中心法则</em>：DNA → RNA → 蛋白质</p>',
    chapter: '第三章 遗传信息'
  },
  {
    name: '酶的特性',
    description: '<p><strong>酶</strong>是生物催化剂，具有以下特性：</p><ul><li><strong>高效性</strong>：催化效率比无机催化剂高10⁷-10¹⁷倍</li><li><strong>专一性</strong>：一种酶只能催化一种或一类化学反应</li><li><strong>温和性</strong>：在温和条件下发挥作用</li></ul><p>影响因素：温度、pH值、酶浓度、底物浓度等</p>',
    chapter: '第二章 细胞代谢'
  },
  {
    name: '孟德尔遗传定律',
    description: '<p><strong>孟德尔遗传定律</strong>包括：</p><ol><li><strong>分离定律</strong>：等位基因在配子形成时分离</li><li><strong>自由组合定律</strong>：非同源染色体上的基因自由组合</li></ol><p>适用条件：</p><ul><li>核基因遗传</li><li>完全显性</li><li>基因间无相互作用</li></ul>',
    chapter: '第三章 遗传信息'
  },
  {
    name: '生态系统的结构',
    description: '<p><strong>生态系统</strong>由生物成分和非生物成分组成：</p><p><strong>生物成分：</strong></p><ul><li>生产者（绿色植物）</li><li>消费者（动物）</li><li>分解者（细菌、真菌）</li></ul><p><strong>非生物成分：</strong></p><ul><li>阳光、温度、水分</li><li>土壤、大气等</li></ul>',
    chapter: '第四章 生态系统'
  },
  {
    name: '细胞分裂',
    description: '<p><strong>细胞分裂</strong>包括<em>有丝分裂</em>和<em>减数分裂</em>两种方式：</p><p><strong>有丝分裂：</strong></p><ul><li>体细胞分裂方式</li><li>保持染色体数目不变</li><li>用于生长发育</li></ul><p><strong>减数分裂：</strong></p><ul><li>生殖细胞形成过程</li><li>染色体数目减半</li><li>产生配子</li></ul>',
    chapter: '第三章 遗传信息'
  },
  {
    name: '蛋白质的结构',
    description: '<p><strong>蛋白质</strong>具有四级结构：</p><ol><li><strong>一级结构</strong>：氨基酸序列</li><li><strong>二级结构</strong>：α螺旋、β折叠</li><li><strong>三级结构</strong>：空间折叠</li><li><strong>四级结构</strong>：多肽链聚合</li></ol><p>蛋白质功能多样：催化、运输、免疫、调节等</p>',
    chapter: '第一章 细胞的分子组成'
  }
];

async function createKnowledgePoints() {
  console.log('开始批量创建知识点...');
  
  for (let i = 0; i < knowledgePoints.length; i++) {
    const kp = knowledgePoints[i];
    
    // 使用curl命令创建知识点
    const curlCommand = `curl -X POST http://localhost:3001/api/knowledge-points -H "Content-Type: application/json" -H "Authorization: Bearer mock_token_1_1759418532830" -d '${JSON.stringify({
      name: kp.name,
      description: kp.description,
      chapter: kp.chapter,
      parentId: '',
      relatedIds: []
    }).replace(/'/g, "'\\''")}' --silent`;
    
    console.log(`正在创建: ${kp.name}`);
    
    // 这里我们输出curl命令，用户可以手动执行
    console.log(curlCommand);
    console.log('---');
  }
  
  console.log('批量创建脚本生成完成！');
}

createKnowledgePoints();